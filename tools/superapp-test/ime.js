'use strict';
// R6 — read the soft-keyboard frame from `dumpsys window`. A frame under 200 px high is the compact
// hardware-keyboard toolbar, not the soft keyboard: the "keyboard does not cover the field" check is
// BLOCKED on that device.

const COMPACT_MAX_PX = 200;

/** dumpsys text -> {visible, top, height, compact} | null when no IME frame is printed. */
function parseIme(dump) {
  const lines = String(dump || '').split('\n').filter((l) => /type=ime\b/.test(l));
  for (const l of lines) {
    const m = l.match(/frame=\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
    if (!m) continue;
    const top = Number(m[2]);
    const height = Number(m[4]) - top;
    const visible = /visible=true/.test(l);
    return { visible, top, height, compact: visible && height < COMPACT_MAX_PX };
  }
  return null;
}

/** A focused field is covered when its bottom edge is below the IME top. */
function covered(fieldBottomPx, ime) {
  if (!ime || !ime.visible) return false;
  return fieldBottomPx > ime.top;
}

module.exports = { COMPACT_MAX_PX, parseIme, covered };
