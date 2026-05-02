/**
 * navbarPets.js — pixel art pets living inside the fixed navbar.
 *
 * Renders a tiny 8-bit ecosystem on the bottom edge of the .banner header:
 *   • a turtle that slowly walks back and forth and occasionally pauses
 *     in front of the MÊIRKS logo to "look" at it
 *   • a sun conure parakeet that walks, hops, and every few seconds
 *     flies up to perch on top of the logo letters before flying back down
 *
 * Implementation notes:
 *   - All sprites are defined as character grids (PALETTE + frames) and
 *     rasterised once into off-screen canvases at boot. No external assets.
 *   - The visible canvas is placed absolutely inside .banner, with the
 *     internal pixel grid kept tiny and CSS scaling it up via
 *     image-rendering: pixelated for crisp pixel-art look.
 *   - The logo bounding box is read from the DOM each frame so that the
 *     pets can use it as both a soft obstacle and a perch point.
 *   - Honors prefers-reduced-motion and pauses when the tab is hidden.
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------- config
  const HEADER_SELECTOR = '.banner';
  const LOGO_SELECTOR = '.logo';
  const CANVAS_ID = 'navbar-pets-canvas';
  const SCALE = 2; // how many device px per logical sprite px (CSS upscaled, pixelated)

  // Shared palette used by every sprite below. Keep keys to a single char.
  const PALETTE = {
    '.': null,         // transparent
    // turtle
    'a': '#143b22',    // shell border / dark
    'b': '#2f7a45',    // shell mid
    'c': '#7fd897',    // shell highlight
    'd': '#d4a56a',    // skin (head/neck)
    'e': '#7a4a25',    // legs / feet (turtle)
    // parakeet (sun conure palette)
    'y': '#ffd535',    // bright yellow head
    'o': '#ff8a1c',    // orange chest/body
    'r': '#d83441',    // red mask around eye
    'g': '#3fa55a',    // green wing
    'B': '#3a7fcc',    // blue tail tip
    'f': '#7a4a25',    // bird feet
    // shared
    'k': '#0e0e12',    // black (eye + beak)
  };

  // -------------------------------------------------------------- sprites
  // Sprites are right-facing. We mirror at runtime when an animal walks left.
  // Width must be constant per sprite (assert below catches mistakes).

  // TURTLE — 18 wide × 11 tall, 2 walking frames
  const TURTLE_W = 18, TURTLE_H = 11;
  const TURTLE_FRAMES = [
    [
      '..................',
      '..................',
      '.......aaaa.......',
      '......accccca.....',
      '.....abccccccba...',
      '....abccccccccba..',
      '....abccccccccbdd.',
      '....abccccacccbdkd',
      '.....aaaaaaaab.dd.',
      '.....e..eee.......',
      '....ee...ee.......',
    ],
    [
      '..................',
      '..................',
      '.......aaaa.......',
      '......accccca.....',
      '.....abccccccba...',
      '....abccccccccba..',
      '....abccccccccbdd.',
      '....abccccacccbdkd',
      '.....aaaaaaaab.dd.',
      '....ee...e........',
      '.....e..ee........',
    ],
  ];

  // PARROT — 12 wide × 10 tall, 2 walk frames + 2 fly frames + 1 perched frame
  const PARROT_W = 12, PARROT_H = 10;
  const PARROT_WALK = [
    [
      '............',
      '.....yyyy...',
      '....yorryy..',
      '....yorkry.k',
      '....yorrr.kk',
      '....yyooy...',
      '...ooooooy..',
      '..oooooooyg.',
      '..ooooooBBy.',
      '...f....f...',
    ],
    [
      '............',
      '.....yyyy...',
      '....yorryy..',
      '....yorkry.k',
      '....yorrr.kk',
      '....yyooy...',
      '...ooooooy..',
      '..oooooooyg.',
      '..ooooooBBy.',
      '....f..f....',
    ],
  ];

  const PARROT_FLY = [
    // wings up
    [
      '.g........g.',
      '..gyyyyyyg..',
      '....yorryy..',
      '....yorkry.k',
      '....yorrr.kk',
      '....yyooy...',
      '...ooooooy..',
      '..oooooooy..',
      '..oooooBBy..',
      '............',
    ],
    // wings down
    [
      '............',
      '.....yyyy...',
      '....yorryy..',
      '....yorkry.k',
      '....yorrr.kk',
      '....yyooy.g.',
      '...oooooygg.',
      '..ooooooyg..',
      '..ooooooBy..',
      '..g......g..',
    ],
  ];

  const PARROT_PERCHED = [
    [
      '............',
      '.....yyyy...',
      '....yorryy..',
      '....yorkry.k',
      '....yorrr.kk',
      '....yyooy...',
      '...ooooooy..',
      '..oooooooyg.',
      '..ooooooBBy.',
      '....ffff....',
    ],
  ];

  // ------------------------------------------------------------ utilities
  function assertGrid(name, grid, w, h) {
    if (!Array.isArray(grid) || grid.length !== h) {
      console.warn(`[navbarPets] ${name}: expected ${h} rows, got ${grid?.length}`);
      return false;
    }
    for (let i = 0; i < grid.length; i++) {
      if (grid[i].length !== w) {
        console.warn(`[navbarPets] ${name} row ${i}: expected width ${w}, got ${grid[i].length}`);
        return false;
      }
    }
    return true;
  }

  // Rasterise a character grid into an off-screen canvas, optionally mirrored.
  function rasterise(grid, w, h, flipped = false) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    for (let y = 0; y < h; y++) {
      const row = grid[y];
      for (let x = 0; x < w; x++) {
        const ch = row[x];
        const color = PALETTE[ch];
        if (color) {
          const dx = flipped ? (w - 1 - x) : x;
          ctx.fillStyle = color;
          ctx.fillRect(dx, y, 1, 1);
        }
      }
    }
    return c;
  }

  function buildSpriteSheet(frames, w, h) {
    return {
      right: frames.map((g) => rasterise(g, w, h, false)),
      left: frames.map((g) => rasterise(g, w, h, true)),
    };
  }

  // ----------------------------------------------------------------- init
  function start() {
    if (window.__navbarPetsInited) return;
    window.__navbarPetsInited = true;

    const reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const banner = document.querySelector(HEADER_SELECTOR);
    const logoEl = document.querySelector(LOGO_SELECTOR);
    if (!banner || !logoEl) return;
    // Prefer the inner text element so the perch box matches the actual
    // glyphs and not the .logo flex container with its gap/padding.
    const logoTextEl = logoEl.querySelector('#site-name') || logoEl;
    // Mobile hamburger: when visible, restricts where pets can walk on the
    // right so they don't visually overlap the toggle button.
    const toggleEl = document.querySelector('.menu-toggle');
    // Mobile dropdown: when open the pets don't add anything but cost CPU
    // behind the menu sheet. We pause the loop while it's expanded.
    const menuEl = document.querySelector('.menu');

    // Validate sprites — silent in prod, warns in dev console.
    assertGrid('turtle f0', TURTLE_FRAMES[0], TURTLE_W, TURTLE_H);
    assertGrid('turtle f1', TURTLE_FRAMES[1], TURTLE_W, TURTLE_H);
    assertGrid('parrot walk 0', PARROT_WALK[0], PARROT_W, PARROT_H);
    assertGrid('parrot walk 1', PARROT_WALK[1], PARROT_W, PARROT_H);
    assertGrid('parrot fly 0', PARROT_FLY[0], PARROT_W, PARROT_H);
    assertGrid('parrot fly 1', PARROT_FLY[1], PARROT_W, PARROT_H);
    assertGrid('parrot perched', PARROT_PERCHED[0], PARROT_W, PARROT_H);

    const turtleSheet = buildSpriteSheet(TURTLE_FRAMES, TURTLE_W, TURTLE_H);
    const parrotWalkSheet = buildSpriteSheet(PARROT_WALK, PARROT_W, PARROT_H);
    const parrotFlySheet = buildSpriteSheet(PARROT_FLY, PARROT_W, PARROT_H);
    const parrotPerchedSheet = buildSpriteSheet(PARROT_PERCHED, PARROT_W, PARROT_H);

    // Inject canvas into the banner.
    let canvas = document.getElementById(CANVAS_ID);
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = CANVAS_ID;
      canvas.className = 'navbar-pets';
      canvas.setAttribute('aria-hidden', 'true');
      banner.appendChild(canvas);
    }
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // -------------------------------------------------------- pet state
    const turtle = {
      kind: 'turtle',
      x: 40,
      y: 0, // recomputed in resize()
      dir: 1, // 1 = right, -1 = left
      speed: 0.014, // logical px / ms
      frame: 0,
      frameAcc: 0,
      frameDur: 260,
      pause: 0, // ms left to stand still
      lookAtLogo: false,
    };

    const parrot = {
      kind: 'parrot',
      state: 'walk', // walk | takeoff | fly | perched | descend
      x: 90,
      y: 0,
      dir: -1,
      speed: 0.04,
      frame: 0,
      frameAcc: 0,
      frameDur: 160,
      pause: 0,
      // flight target (in logical pixels)
      target: null,
      // timer until next flight to logo
      nextFlight: 6000 + Math.random() * 4000,
      perchTimer: 0,
    };

    // ---------------------------------------------------- canvas sizing
    let bannerCssH = 0;
    let bannerCssW = 0;
    let logicalW = 0;
    let logicalH = 0;
    let groundY = 0;

    function resize() {
      const rect = banner.getBoundingClientRect();
      bannerCssW = Math.max(1, Math.floor(rect.width));
      bannerCssH = Math.max(1, Math.floor(rect.height));
      logicalW = Math.max(80, Math.floor(bannerCssW / SCALE));
      logicalH = Math.max(20, Math.floor(bannerCssH / SCALE));

      canvas.width = logicalW;
      canvas.height = logicalH;
      canvas.style.width = (logicalW * SCALE) + 'px';
      canvas.style.height = (logicalH * SCALE) + 'px';

      ctx.imageSmoothingEnabled = false;

      groundY = logicalH - 1; // sprite "feet" sit on this row
      turtle.y = groundY - TURTLE_H + 1;
      // keep parrot aligned to the same ground unless flying
      if (parrot.state === 'walk') parrot.y = groundY - PARROT_H + 1;

      // Clamp x to new bounds.
      turtle.x = clamp(turtle.x, 4, logicalW - TURTLE_W - 4);
      parrot.x = clamp(parrot.x, 4, logicalW - PARROT_W - 4);
    }

    function logoBox() {
      // Returns logo bounding box in canvas-internal logical pixels.
      // - obstacleRight: full .logo div right edge (used for soft collision)
      // - perchLeft/perchRight/perchTop: inner text element bbox (used to land
      //   the parrot on the actual glyphs, not on the trailing whitespace).
      const br = banner.getBoundingClientRect();
      const lr = logoEl.getBoundingClientRect();
      const tr = logoTextEl.getBoundingClientRect();
      return {
        left: Math.max(0, Math.floor((lr.left - br.left) / SCALE)),
        right: Math.min(logicalW, Math.ceil((lr.right - br.left) / SCALE)),
        top: Math.max(0, Math.floor((lr.top - br.top) / SCALE)),
        bottom: Math.min(logicalH, Math.ceil((lr.bottom - br.top) / SCALE)),
        perchLeft: Math.max(0, Math.floor((tr.left - br.left) / SCALE)),
        perchRight: Math.min(logicalW, Math.ceil((tr.right - br.left) / SCALE)),
        perchTop: Math.max(0, Math.floor((tr.top - br.top) / SCALE)),
        perchBottom: Math.min(logicalH, Math.ceil((tr.bottom - br.top) / SCALE)),
      };
    }

    // The visible glyph top sits a bit below the line-box top because of font
    // leading. This compensates so the parrot's feet visually rest on the
    // letters instead of floating above them. Tweak if the font changes.
    const PERCH_GLYPH_FUDGE = 2;

    function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

    // Computes the right boundary inside which pets are free to walk. On
    // mobile, the menu-toggle button is rendered at the right edge of the
    // banner; we treat its left side as a soft wall so pets don't slide
    // behind the hamburger icon. On desktop, where the toggle is hidden,
    // we fall back to the canvas right edge.
    function rightBound() {
      if (toggleEl) {
        const cs = window.getComputedStyle(toggleEl);
        if (cs && cs.display !== 'none' && cs.visibility !== 'hidden') {
          const tr = toggleEl.getBoundingClientRect();
          const br = banner.getBoundingClientRect();
          if (tr.width > 0) {
            return clamp(Math.floor((tr.left - br.left) / SCALE) - 4, 8, logicalW - 4);
          }
        }
      }
      return logicalW - 4;
    }

    // Whether the mobile dropdown menu is currently open. The site script in
    // script.js toggles `.menu.active` (and sets aria-expanded on the toggle).
    // While open we skip rendering: the canvas is contained in the banner so
    // it is not visible behind the dropdown sheet anyway.
    function isMobileMenuOpen() {
      if (menuEl && menuEl.classList.contains('active')) return true;
      if (toggleEl && toggleEl.getAttribute('aria-expanded') === 'true') return true;
      return false;
    }

    // Computes where the parrot should land on the logo letters.
    // - x: aligns the parrot's right edge to the right of the visible text,
    //   so the bird actually sits on the last letters of MÊIRKS.
    // - y: places the foot row (sprite row 9) on the top of the visible
    //   glyphs, accounting for line-leading via PERCH_GLYPH_FUDGE.
    function perchTarget(lb) {
      const right = (lb.perchRight != null ? lb.perchRight : lb.right);
      const top = (lb.perchTop != null ? lb.perchTop : lb.top);
      const x = clamp(right - PARROT_W + 1, 0, logicalW - PARROT_W);
      // PARROT_H is sprite height; feet are at sprite row PARROT_H-1, so the
      // sprite top must be (top + fudge) - (PARROT_H - 1) for feet on top edge.
      const y = clamp(top + PERCH_GLYPH_FUDGE - (PARROT_H - 1), 0, logicalH - PARROT_H);
      return { x, y };
    }

    // ---------------------------------------------------- update logic
    function updateTurtle(dt) {
      // Pause behavior (e.g. looking at the logo).
      if (turtle.pause > 0) {
        turtle.pause -= dt;
        return;
      }

      const lb = logoBox();
      // Soft obstacle: don't walk into the logo column. Turtle walks on the
      // right side of the logo only, and stops short of the hamburger toggle
      // when on mobile.
      const minX = lb.right + 6;
      const maxX = rightBound() - TURTLE_W;

      // Walk
      turtle.x += turtle.speed * turtle.dir * dt;

      // Bounce off bounds
      if (turtle.x <= minX) {
        turtle.x = minX;
        turtle.dir = 1;
        // Looking-at-logo pause when we just bounced off the logo edge
        if (Math.random() < 0.6) {
          turtle.pause = 1100 + Math.random() * 1400;
          turtle.lookAtLogo = true;
          turtle.dir = -1; // face logo (left)
        }
      } else if (turtle.x >= maxX) {
        turtle.x = maxX;
        turtle.dir = -1;
        if (Math.random() < 0.25) {
          turtle.pause = 700 + Math.random() * 900;
        }
      } else {
        turtle.lookAtLogo = false;
      }

      // Random slow-down standstill
      if (Math.random() < dt * 0.00005) {
        turtle.pause = 600 + Math.random() * 1000;
      }

      // Animate frame
      turtle.frameAcc += dt;
      if (turtle.frameAcc >= turtle.frameDur) {
        turtle.frameAcc = 0;
        turtle.frame = (turtle.frame + 1) % TURTLE_FRAMES.length;
      }
    }

    function updateParrot(dt) {
      const lb = logoBox();

      switch (parrot.state) {
        case 'walk': {
          if (parrot.pause > 0) {
            parrot.pause -= dt;
          } else {
            parrot.x += parrot.speed * parrot.dir * dt;
            const minX = lb.right + 4;
            const maxX = rightBound() - PARROT_W;
            if (parrot.x <= minX) {
              parrot.x = minX;
              parrot.dir = 1;
              if (Math.random() < 0.4) parrot.pause = 400 + Math.random() * 800;
            } else if (parrot.x >= maxX) {
              parrot.x = maxX;
              parrot.dir = -1;
              if (Math.random() < 0.4) parrot.pause = 400 + Math.random() * 800;
            }
          }

          // Walk frame animation
          parrot.frameDur = 150;
          parrot.frameAcc += dt;
          if (parrot.frameAcc >= parrot.frameDur) {
            parrot.frameAcc = 0;
            parrot.frame = (parrot.frame + 1) % PARROT_WALK.length;
          }

          // Time until next flight to logo
          parrot.nextFlight -= dt;
          if (parrot.nextFlight <= 0) {
            parrot.state = 'fly';
            parrot.dir = -1; // fly toward the logo on the left
            parrot.target = perchTarget(lb);
            parrot.frame = 0;
            parrot.frameAcc = 0;
          }
          break;
        }

        case 'fly': {
          // Move toward target with simple lerp.
          const tx = parrot.target.x;
          const ty = parrot.target.y;
          const dx = tx - parrot.x;
          const dy = ty - parrot.y;
          const dist = Math.hypot(dx, dy);
          parrot.dir = dx >= 0 ? 1 : -1;
          const flySpeed = 0.07; // logical px / ms
          if (dist < 0.6) {
            parrot.x = tx;
            parrot.y = ty;
            parrot.state = 'perched';
            parrot.perchTimer = 2200 + Math.random() * 1500;
            parrot.frame = 0;
            parrot.frameAcc = 0;
          } else {
            parrot.x += (dx / dist) * flySpeed * dt;
            parrot.y += (dy / dist) * flySpeed * dt;
          }
          // Wing-flap animation
          parrot.frameDur = 110;
          parrot.frameAcc += dt;
          if (parrot.frameAcc >= parrot.frameDur) {
            parrot.frameAcc = 0;
            parrot.frame = (parrot.frame + 1) % PARROT_FLY.length;
          }
          break;
        }

        case 'perched': {
          parrot.perchTimer -= dt;
          // Re-anchor to the live logo position (in case of resize / scroll).
          const t = perchTarget(lb);
          parrot.x = t.x;
          parrot.y = t.y;
          // Face the body of the word, not into empty space.
          parrot.dir = -1;
          if (parrot.perchTimer <= 0) {
            parrot.state = 'descend';
            const rb = rightBound() - PARROT_W;
            parrot.target = {
              x: clamp(lb.right + 20 + Math.random() * 60, lb.right + 6, rb),
              y: groundY - PARROT_H + 1,
            };
            parrot.frame = 0;
            parrot.frameAcc = 0;
          }
          break;
        }

        case 'descend': {
          const tx = parrot.target.x;
          const ty = parrot.target.y;
          const dx = tx - parrot.x;
          const dy = ty - parrot.y;
          const dist = Math.hypot(dx, dy);
          parrot.dir = dx >= 0 ? 1 : -1;
          const flySpeed = 0.06;
          if (dist < 0.6) {
            parrot.x = tx;
            parrot.y = ty;
            parrot.state = 'walk';
            parrot.nextFlight = 7000 + Math.random() * 6000;
            parrot.frame = 0;
            parrot.frameAcc = 0;
          } else {
            parrot.x += (dx / dist) * flySpeed * dt;
            parrot.y += (dy / dist) * flySpeed * dt;
          }
          parrot.frameDur = 110;
          parrot.frameAcc += dt;
          if (parrot.frameAcc >= parrot.frameDur) {
            parrot.frameAcc = 0;
            parrot.frame = (parrot.frame + 1) % PARROT_FLY.length;
          }
          break;
        }
      }
    }

    // ---------------------------------------------------- render logic
    function drawTurtle() {
      const sheet = turtle.dir >= 0 ? turtleSheet.right : turtleSheet.left;
      const sprite = sheet[turtle.frame];
      ctx.drawImage(sprite, Math.round(turtle.x), Math.round(turtle.y));
    }

    function drawParrot() {
      let sheet;
      if (parrot.state === 'walk') sheet = parrot.dir >= 0 ? parrotWalkSheet.right : parrotWalkSheet.left;
      else if (parrot.state === 'perched') sheet = parrot.dir >= 0 ? parrotPerchedSheet.right : parrotPerchedSheet.left;
      else sheet = parrot.dir >= 0 ? parrotFlySheet.right : parrotFlySheet.left;
      const sprite = sheet[parrot.frame % sheet.length];
      ctx.drawImage(sprite, Math.round(parrot.x), Math.round(parrot.y));
    }

    function render() {
      ctx.clearRect(0, 0, logicalW, logicalH);
      // Draw turtle behind parrot (parrot can fly over it).
      drawTurtle();
      drawParrot();
    }

    // -------------------------------------------------------- main loop
    let lastT = performance.now();
    let running = true;

    function tick(now) {
      if (!running) return;
      let dt = now - lastT;
      lastT = now;
      // Clamp dt to avoid huge jumps after tab was hidden.
      if (dt > 80) dt = 80;
      // Skip updating + drawing while the mobile dropdown menu is open or
      // when the canvas itself was hidden via CSS (very small screens).
      const visible = canvas.offsetParent !== null && !isMobileMenuOpen();
      if (visible) {
        updateTurtle(dt);
        updateParrot(dt);
        render();
      }
      requestAnimationFrame(tick);
    }

    // -------------------------------------------------------- listeners
    // Plain window resize covers desktop reflows. ResizeObserver also catches
    // banner-only changes (e.g. the .scrolled class flips min-height between
    // 72 and 64, or the responsive media queries shrink the navbar).
    window.addEventListener('resize', () => { resize(); }, { passive: true });
    window.addEventListener('orientationchange', () => { resize(); }, { passive: true });

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => resize());
      ro.observe(banner);
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        running = false;
      } else if (!running) {
        running = true;
        lastT = performance.now();
        requestAnimationFrame(tick);
      }
    });

    // Re-measure when fonts load (logo width might change slightly once the
    // custom Montserrat face is applied).
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => resize()).catch(() => {});
    }

    resize();
    requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
