/**
 * MarkdownLite — small dependency-free markdown renderer.
 *
 * Designed for slide detail descriptions in the public modal panel and the
 * admin editor preview. Output is safe to inject via innerHTML: every input
 * character is HTML-escaped before any markdown syntax is applied, and only
 * a tightly scoped set of inline transforms is allowed.
 *
 * Supported syntax (CommonMark-ish subset):
 *   # / ## / ### / ####     headings (rendered as h2…h5 inside the panel)
 *   **bold** / __bold__     bold
 *   *italic* / _italic_     italic
 *   `code`                  inline code
 *   ~~strike~~              strikethrough
 *   [text](url)             links (http(s)/mailto only)
 *   > quote                 blockquotes (consecutive lines)
 *   - / * / + item          unordered list
 *   1. item                 ordered list
 *   ---                     horizontal rule
 *                           (blank line = paragraph separator)
 *
 * Anything else is preserved as a plain paragraph, so legacy plain-text
 * descriptions render untouched.
 */
(function (global) {
  'use strict';

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Allow only http(s) and mailto links; everything else falls back to "#"
  function safeUrl(raw) {
    const url = String(raw || '').trim();
    if (/^(https?:|mailto:)/i.test(url)) return url;
    if (/^\/[^/]/.test(url) || /^#/.test(url)) return url; // local anchor / path
    return '#';
  }

  // Inline transforms applied AFTER HTML-escaping the raw line.
  // Order matters: code first (to skip transforms inside it), then links,
  // then bold (double markers) before italic (single markers).
  function renderInline(escaped) {
    let s = escaped;

    // Inline code: `text` -> <code>text</code>
    s = s.replace(/`([^`\n]+?)`/g, (_, code) => `<code>${code}</code>`);

    // Links: [text](url)
    s = s.replace(/\[([^\]]+?)\]\(([^)\s]+)\)/g, (_, text, url) => {
      const safe = safeUrl(url);
      const isExternal = /^https?:/i.test(safe);
      const attrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${safe}"${attrs}>${text}</a>`;
    });

    // Bold (run before italic so "**a**" doesn't get eaten by italic regex)
    s = s.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/__([^_\n]+?)__/g, '<strong>$1</strong>');

    // Italic
    s = s.replace(/(^|[\s(])\*([^*\n]+?)\*(?=[\s).,!?:;]|$)/g, '$1<em>$2</em>');
    s = s.replace(/(^|[\s(])_([^_\n]+?)_(?=[\s).,!?:;]|$)/g, '$1<em>$2</em>');

    // Strikethrough
    s = s.replace(/~~([^~\n]+?)~~/g, '<del>$1</del>');

    return s;
  }

  function renderInlineFromRaw(raw) {
    return renderInline(escapeHtml(raw));
  }

  // Block-level parser: split source into blocks separated by blank lines.
  function render(source) {
    if (source == null) return '';
    const text = String(source).replace(/\r\n?/g, '\n').replace(/\t/g, '    ');
    if (!text.trim()) return '';

    const lines = text.split('\n');
    const out = [];
    let i = 0;

    const isBlank = (s) => /^\s*$/.test(s);
    const isHr = (s) => /^\s*([-*_])(\s*\1){2,}\s*$/.test(s);
    const headingMatch = (s) => /^(#{1,4})\s+(.+?)\s*#*\s*$/.exec(s);
    const ulMatch = (s) => /^\s*[-*+]\s+(.+)$/.exec(s);
    const olMatch = (s) => /^\s*\d+[.)]\s+(.+)$/.exec(s);
    const quoteMatch = (s) => /^\s*>\s?(.*)$/.exec(s);

    while (i < lines.length) {
      const line = lines[i];

      if (isBlank(line)) { i++; continue; }

      // Horizontal rule
      if (isHr(line)) { out.push('<hr />'); i++; continue; }

      // Heading
      const h = headingMatch(line);
      if (h) {
        const level = Math.min(5, h[1].length + 1); // # -> h2, ## -> h3, ### -> h4, #### -> h5
        out.push(`<h${level}>${renderInlineFromRaw(h[2])}</h${level}>`);
        i++;
        continue;
      }

      // Blockquote
      if (quoteMatch(line)) {
        const buf = [];
        while (i < lines.length && quoteMatch(lines[i])) {
          buf.push(quoteMatch(lines[i])[1]);
          i++;
        }
        out.push(`<blockquote><p>${renderInlineFromRaw(buf.join(' '))}</p></blockquote>`);
        continue;
      }

      // Unordered list
      if (ulMatch(line)) {
        const items = [];
        while (i < lines.length && ulMatch(lines[i])) {
          items.push(`<li>${renderInlineFromRaw(ulMatch(lines[i])[1])}</li>`);
          i++;
        }
        out.push(`<ul>${items.join('')}</ul>`);
        continue;
      }

      // Ordered list
      if (olMatch(line)) {
        const items = [];
        while (i < lines.length && olMatch(lines[i])) {
          items.push(`<li>${renderInlineFromRaw(olMatch(lines[i])[1])}</li>`);
          i++;
        }
        out.push(`<ol>${items.join('')}</ol>`);
        continue;
      }

      // Paragraph: collect consecutive non-blank, non-special lines
      const paragraphLines = [];
      while (
        i < lines.length &&
        !isBlank(lines[i]) &&
        !isHr(lines[i]) &&
        !headingMatch(lines[i]) &&
        !ulMatch(lines[i]) &&
        !olMatch(lines[i]) &&
        !quoteMatch(lines[i])
      ) {
        paragraphLines.push(lines[i]);
        i++;
      }
      // Inside paragraph: trailing two spaces = explicit <br>
      const html = paragraphLines
        .map((ln, idx) => {
          const hardBreak = /  +$/.test(ln) && idx < paragraphLines.length - 1;
          const rendered = renderInlineFromRaw(ln.replace(/\s+$/, ''));
          return rendered + (hardBreak ? '<br />' : '');
        })
        .join(' ');
      out.push(`<p>${html}</p>`);
    }

    return out.join('\n');
  }

  global.MarkdownLite = {
    render,
    escapeHtml
  };
})(typeof window !== 'undefined' ? window : globalThis);
