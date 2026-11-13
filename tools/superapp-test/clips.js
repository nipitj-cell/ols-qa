'use strict';
// R8, R11 — clip names, split plan, the upload bridge limit, and the read-back comparison.

const BRIDGE_LIMIT_BYTES = 10 * 1024 * 1024; // one upload call, counted as base64
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** {KEY}_AC_{nn}_{slug}[_partN].mp4 */
function clipName({ key, ac, slug, part }) {
  if (!key || !/^[A-Z][A-Z0-9]*-\d+$/.test(key)) throw new Error(`bad key: ${key}`);
  if (!Number.isInteger(ac) || ac < 1) throw new Error(`bad ac: ${ac}`);
  if (!SLUG.test(slug || '')) throw new Error(`bad slug: ${slug}`);
  const nn = String(ac).padStart(2, '0');
  return `${key}_AC_${nn}_${slug}${part ? `_part${part}` : ''}.mp4`;
}

/** Base64 size of a payload. */
function base64Bytes(bytes) {
  return Math.ceil(bytes / 3) * 4;
}

/** True when every file in ONE call fits together: the bridge sums the whole call. */
function fitsOneCall(sizes) {
  return sizes.reduce((s, b) => s + base64Bytes(b), 0) <= BRIDGE_LIMIT_BYTES;
}

/** Split a clip into time parts so each part stays under maxBytes. 1 s overlap keeps no state unseen. */
function planSplit({ durationSec, bytes, maxBytes = 6 * 1024 * 1024, overlapSec = 1 }) {
  const n = Math.max(1, Math.ceil(bytes / maxBytes));
  if (n === 1) return [{ part: 0, start: 0, duration: durationSec }];
  const each = Math.ceil(durationSec / n);
  const parts = [];
  for (let i = 0; i < n; i++) {
    const start = Math.max(0, i * each - (i ? overlapSec : 0));
    const end = Math.min(durationSec, (i + 1) * each);
    parts.push({ part: i + 1, start, duration: end - start });
  }
  return parts;
}

/**
 * local: [{name,size}]  remote: [{title,size}] -> {ok, missing, sizeMismatch, extra, duplicates}
 * Names and byte sizes must match exactly; a name listed twice is a duplicate.
 */
function compareReadback(local, remote) {
  const byName = new Map();
  const duplicates = [];
  for (const r of remote) {
    if (byName.has(r.title)) duplicates.push(r.title);
    byName.set(r.title, r.size);
  }
  const missing = [];
  const sizeMismatch = [];
  for (const l of local) {
    if (!byName.has(l.name)) missing.push(l.name);
    else if (Number(byName.get(l.name)) !== Number(l.size)) sizeMismatch.push(l.name);
  }
  const localNames = new Set(local.map((l) => l.name));
  const extra = [...byName.keys()].filter((n) => !localNames.has(n));
  return { ok: !missing.length && !sizeMismatch.length && !duplicates.length, missing, sizeMismatch, extra, duplicates };
}

module.exports = { BRIDGE_LIMIT_BYTES, clipName, base64Bytes, fitsOneCall, planSplit, compareReadback };
