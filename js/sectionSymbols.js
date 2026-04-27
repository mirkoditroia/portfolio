/**
 * Shared library of "esoteric / spiritual" glyphs used as section dividers.
 *
 * Each entry is a single Unicode character (or short sequence) that can be
 * rendered as text. The list is grouped into categories so the admin picker
 * can present them in a tidy way.
 *
 * Both the public site (script.js) and the admin panel (admin/script.js)
 * load this file. Keep the catalogue here so it stays in sync.
 */
(function (global) {
  'use strict';

  const CATEGORIES = [
    {
      id: 'sacred',
      label: 'Sacri / Spirituali',
      symbols: ['☥', '☯', '☸', '✡', '☪', '✝', '☦', '✠', '☮', '⚛', '⛧', '⛤', '✶', '✷', '✸', '❋']
    },
    {
      id: 'celestial',
      label: 'Sole / Luna / Stelle',
      symbols: ['☀', '☉', '☽', '☾', '★', '☆', '✦', '✧', '✩', '✪', '✫', '✬', '✭', '✮', '✯', '✰']
    },
    {
      id: 'planetary',
      label: 'Pianeti',
      symbols: ['☿', '♀', '♁', '♂', '♃', '♄', '♅', '♆', '♇']
    },
    {
      id: 'zodiac',
      label: 'Zodiaco',
      symbols: ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓']
    },
    {
      id: 'alchemy',
      label: 'Alchemia / Elementi',
      symbols: ['🜁', '🜂', '🜃', '🜄', '🜔', '🜚', '🜛', '🜨', '🜭', '🜲', '🝳', '🝛', '🝤', '🝮']
    },
    {
      id: 'runes',
      label: 'Rune (Futhark)',
      symbols: ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛊ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ', 'ᛚ', 'ᛜ', 'ᛞ', 'ᛟ']
    },
    {
      id: 'iching',
      label: 'I-Ching / Trigrammi',
      symbols: ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷']
    },
    {
      id: 'geometric',
      label: 'Geometrici',
      symbols: ['◯', '◉', '⊙', '⊕', '⊗', '⊛', '◈', '◇', '◆', '△', '▽', '◬', '▲', '▼', '⬡', '⬢', '⬣']
    },
    {
      id: 'mystic',
      label: 'Mistici / Tipografici',
      symbols: ['†', '‡', '※', '☥', '⚜', '✥', '✤', '✣', '❖', '❉', '❈', '⚚', '⚘', '☘', '⌬', '⏃']
    }
  ];

  // Flat list of every symbol, useful for validation
  const ALL = CATEGORIES.reduce((acc, c) => acc.concat(c.symbols), []);

  // Default fallback when a section has no symbol set
  const DEFAULT_SYMBOL = '✶';

  function isValidSymbol(s) {
    if (!s || typeof s !== 'string') return false;
    // Accept any single visible char; we don't strictly enforce membership
    // in ALL so users can paste their own custom glyph from /admin if they
    // really want to.
    return s.trim().length > 0 && s.trim().length <= 8;
  }

  global.SectionSymbols = {
    CATEGORIES,
    ALL,
    DEFAULT_SYMBOL,
    isValidSymbol
  };
})(typeof window !== 'undefined' ? window : globalThis);
