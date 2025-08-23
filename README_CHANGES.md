# Refactor Mobile-First & Performance

Progetto: HTML/CSS/JS vanilla. Focus: UI/UX mobile‑first, accessibilità, performance.

## Modifiche principali

- CSS tokens in `:root` (colori, raggi, ombre, timing) per coerenza visiva
- SectionHeader: divider animato teal con glow e rispetto di `prefers-reduced-motion`
- Card UI: bordo arrotondato, ombra soft, micro‑anim (scale 1.02, 180ms), overlay CTA (Preview, Case/Video)
- Tag categorie per card (opzionali, max 3, uppercase)
- Mobile canvases verticali e immagini 16:9 gestite automaticamente
- Navbar: ARIA attributes, focus trap per hamburger, chiusura con ESC
- Lazy immagini: `loading="lazy"` + `decoding="async"`
- SEO/social: meta OG + Twitter, theme‑color, color‑scheme
- Footer con social/email e © anno corrente

## File toccati

- `style.css`: tokens, section header, card overlay, tags, miglioramenti mobile
- `script.js`: card overlay e tag, lazy attrs immagini, focus trap menu, touch tuning
- `index.html`: meta SEO/social, id menu per ARIA, footer con social e anno
- `render.yaml`: (precedente attività) blueprint deploy su Render

## Build/Run

Node server: `npm start` (porta 3000). Statico servito da `server.js`.

## Checklist Accessibilità/Performance

- [x] Focus ring visibile e navigazione tastiera nel menu
- [x] Menu mobile: aria-haspopup/expanded/controls, ESC per chiudere
- [x] Lazy loading immagini + decoding async
- [x] `prefers-reduced-motion` disabilita transizioni non essenziali
- [x] Contrasto AA (sfondi scuri, testo #fff)
- [x] Titoli univoci e alt immagini derivato dal titolo

## TODO futuri

- Migliorare `initScrollSpy` usando IntersectionObserver per precisione e minor lavoro in scroll
- Script di build immagini WebP/AVIF lato CI e sostituzione automatica srcset
- Migrazione a componentizzazione leggera (es. Web Components) se necessario
- Test Lighthouse su mobile per LCP/CLS; budget LCP < 2.5s, CLS < 0.1


