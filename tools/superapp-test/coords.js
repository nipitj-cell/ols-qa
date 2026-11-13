'use strict';
// R5 — WebView CSS px -> device px, the tappable band, the stable-before-tap check, short slow scrolls.
//   top = base - innerHeight * dpr      base = IME top while the soft keyboard shows, else screen height
//   x = (left + width/2) * dpr          y = top + (rect.top + rect.height/2) * dpr

const BAND = { default: { min: 580, max: 2180 }, menu: { min: 300, max: 2330 } };

function baseOf({ imeTop, screenH }) {
  return Number.isFinite(imeTop) && imeTop > 0 ? imeTop : screenH;
}

function cssToDevice({ dpr, base, innerHeight }, rect) {
  const top = base - innerHeight * dpr;
  return {
    x: Math.round((rect.left + rect.width / 2) * dpr),
    y: Math.round(top + (rect.top + rect.height / 2) * dpr),
  };
}

/** The band shrinks to IME top - 30 while the keyboard is visible. */
function bandFor(kind, imeTop) {
  const b = { ...(BAND[kind] || BAND.default) };
  if (Number.isFinite(imeTop) && imeTop > 0) b.max = Math.min(b.max, imeTop - 30);
  return b;
}

function inBand(y, band) {
  return y >= band.min && y <= band.max;
}

/** Two reads 250 ms apart: tap only when the element moved <= tol px. */
function isStable(a, b, tol = 4) {
  return Math.abs(a.x - b.x) <= tol && Math.abs(a.y - b.y) <= tol;
}

/** Split a scroll distance into short slow swipes (<= max px each). */
function scrollSteps(distancePx, max = 550) {
  const sign = distancePx < 0 ? -1 : 1;
  let left = Math.abs(distancePx);
  const steps = [];
  while (left > 0) {
    const s = Math.min(max, left);
    steps.push(sign * s);
    left -= s;
  }
  return steps;
}

module.exports = { BAND, baseOf, cssToDevice, bandFor, inBand, isStable, scrollSteps };
