'use strict';
// R7 — find a tap point from OCR rows when the WebView cannot be reached (non-debuggable image).
// Rows are the TSV that swift/ocr.swift prints: text <TAB> centerX <TAB> centerY <TAB> width <TAB> height,
// device pixels, origin top-left.

function parseRows(tsv) {
  return String(tsv || '')
    .split('\n')
    .filter(Boolean)
    .map((l) => {
      const [text, cx, cy, w, h] = l.split('\t');
      return { text, x: Number(cx), y: Number(cy), w: Number(w), h: Number(h) };
    })
    .filter((r) => r.text !== undefined && Number.isFinite(r.x) && Number.isFinite(r.y));
}

/** First row (reading order as printed) whose text matches. opts: exact, minY, maxY. -> {x,y} | null */
function findText(rows, text, opts = {}) {
  const lo = opts.minY ?? 0;
  const hi = opts.maxY ?? Infinity;
  for (const r of rows) {
    if (r.y < lo || r.y > hi) continue;
    const hit = opts.exact ? r.text === text : r.text.includes(text);
    if (hit) return { x: r.x, y: r.y };
  }
  return null;
}

module.exports = { parseRows, findText };
