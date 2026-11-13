#!/usr/bin/env node
'use strict';
/**
 * Pins tools/superapp-test (spec: docs/sdd/mobile-superapp-testing R2, R4–R8, R11, R14).
 * Every rule has one case that must pass and one that must not (known-answer self-test, R14).
 *
 *   node tools/superapp-test/superapp_test.test.js
 *
 * Exit 0 only if tests ran AND all passed. Zero tests run is a refusal, not a pass.
 */

const assert = require('assert');
const device = require('./device');
const guard = require('./guard');
const coords = require('./coords');
const ime = require('./ime');
const ocr = require('./ocr');
const clips = require('./clips');

let ran = 0;
let failed = 0;
function t(name, fn) {
  ran++;
  try {
    fn();
  } catch (e) {
    failed++;
    console.error(`FAIL  ${name}\n      ${e.message}`);
  }
}

// ---- R2 device ----
const DEVICES = 'List of devices attached\nemulator-5554\tdevice\nemulator-5558\tdevice\nemulator-5560\toffline\n';
t('R2 parseDevices keeps only state=device', () => {
  assert.deepStrictEqual(device.parseDevices(DEVICES).map((d) => d.serial), ['emulator-5554', 'emulator-5558']);
});
t('R2 resolveSerial finds the AVD by name', () => {
  const r = device.resolveSerial(device.parseDevices(DEVICES), { 'emulator-5554': 'A', 'emulator-5558': 'B' }, 'B');
  assert.deepStrictEqual(r, { ok: true, serial: 'emulator-5558' });
});
t('R2 resolveSerial refuses an unknown AVD', () => {
  const r = device.resolveSerial(device.parseDevices(DEVICES), { 'emulator-5554': 'A' }, 'B');
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.reason, 'no-device');
});
t('R2 resolveSerial refuses two emulators with the same name', () => {
  const r = device.resolveSerial(device.parseDevices(DEVICES), { 'emulator-5554': 'A', 'emulator-5558': 'A' }, 'A');
  assert.strictEqual(r.reason, 'ambiguous');
});
t('R2 isBusy: a pid means busy, empty means idle', () => {
  assert.strictEqual(device.isBusy('12345\n'), true);
  assert.strictEqual(device.isBusy(''), false);
  assert.strictEqual(device.isBusy('\n'), false);
});

// ---- R4 guard ----
t('R4 back key is refused (number and name)', () => {
  assert.strictEqual(guard.checkAdbArgs(['input', 'keyevent', '4']).ok, false);
  assert.strictEqual(guard.checkAdbArgs(['input', 'keyevent', 'KEYCODE_BACK']).ok, false);
});
t('R4 ESC is refused (number and name)', () => {
  assert.strictEqual(guard.checkAdbArgs(['input', 'keyevent', '111']).ok, false);
  assert.strictEqual(guard.checkAdbArgs(['input', 'keyevent', 'KEYCODE_ESCAPE']).ok, false);
});
t('R4 back inside a long-press form is still refused', () => {
  assert.strictEqual(guard.checkAdbArgs(['input', 'keyevent', '--longpress', '4']).ok, false);
});
t('R4 ordinary taps, swipes and other keys pass', () => {
  assert.strictEqual(guard.checkAdbArgs(['input', 'tap', '10', '20']).ok, true);
  assert.strictEqual(guard.checkAdbArgs(['input', 'swipe', '1', '2', '3', '4', '500']).ok, true);
  assert.strictEqual(guard.checkAdbArgs(['input', 'keyevent', 'KEYCODE_ENTER']).ok, true);
  assert.strictEqual(guard.checkAdbArgs(['input', 'keyevent', '24']).ok, true);
});
t('R4 text is refused on a login screen, allowed elsewhere', () => {
  assert.strictEqual(guard.checkAdbArgs(['input', 'text', 'x'], { loginForeground: true }).ok, false);
  assert.strictEqual(guard.checkAdbArgs(['input', 'text', 'x'], { loginForeground: false }).ok, true);
});

// ---- R5 coords ----
t('R5 cssToDevice with the keyboard hidden', () => {
  const p = coords.cssToDevice({ dpr: 2.625, base: 2400, innerHeight: 834 }, { left: 10, top: 100, width: 100, height: 40 });
  assert.deepStrictEqual(p, { x: 158, y: Math.round(2400 - 834 * 2.625 + 120 * 2.625) });
});
t('R5 base switches to the IME top while the keyboard shows', () => {
  assert.strictEqual(coords.baseOf({ imeTop: 1500, screenH: 2400 }), 1500);
  assert.strictEqual(coords.baseOf({ imeTop: null, screenH: 2400 }), 2400);
});
t('R5 band: default, menu, and shrunk by the IME', () => {
  assert.deepStrictEqual(coords.bandFor('default'), { min: 580, max: 2180 });
  assert.deepStrictEqual(coords.bandFor('menu'), { min: 300, max: 2330 });
  assert.strictEqual(coords.bandFor('default', 1500).max, 1470);
  assert.strictEqual(coords.inBand(1000, coords.bandFor('default')), true);
  assert.strictEqual(coords.inBand(2300, coords.bandFor('default')), false);
});
t('R5 stable read: 4 px passes, 5 px does not', () => {
  assert.strictEqual(coords.isStable({ x: 100, y: 100 }, { x: 104, y: 100 }), true);
  assert.strictEqual(coords.isStable({ x: 100, y: 100 }, { x: 100, y: 105 }), false);
});
t('R5 scroll steps never exceed 550 px and sum to the distance', () => {
  const s = coords.scrollSteps(1300);
  assert.ok(s.every((x) => Math.abs(x) <= 550));
  assert.strictEqual(s.reduce((a, b) => a + b, 0), 1300);
  assert.strictEqual(coords.scrollSteps(-600).reduce((a, b) => a + b, 0), -600);
});

// ---- R6 ime ----
const DUMP_SOFT = '  InsetsSource type=ime frame=[0,1527][1080,2400] visible=true\n  other line\n';
const DUMP_COMPACT = '  InsetsSource type=ime frame=[0,2337][1080,2400] visible=true\n';
const DUMP_NONE = '  InsetsSource type=statusBars frame=[0,0][1080,63] visible=true\n';
t('R6 soft keyboard frame is parsed, not compact', () => {
  assert.deepStrictEqual(ime.parseIme(DUMP_SOFT), { visible: true, top: 1527, height: 873, compact: false });
});
t('R6 a 63 px frame is the compact toolbar', () => {
  const r = ime.parseIme(DUMP_COMPACT);
  assert.strictEqual(r.height, 63);
  assert.strictEqual(r.compact, true);
});
t('R6 no IME line gives null', () => {
  assert.strictEqual(ime.parseIme(DUMP_NONE), null);
});
t('R6 covered: field below the IME top is covered, above is not, hidden keyboard never covers', () => {
  const r = ime.parseIme(DUMP_SOFT);
  assert.strictEqual(ime.covered(1600, r), true);
  assert.strictEqual(ime.covered(1400, r), false);
  assert.strictEqual(ime.covered(1600, { visible: false, top: 1527, height: 0 }), false);
});

// ---- R7 ocr ----
const OCR = 'จัดการสื่อ\t109\t476\t142\t38\nทั้งหมด\t135\t1220\t125\t50\nวิดีโอสั้น\t175\t1665\t200\t40\nวิดีโอ\t148\t1817\t100\t40\n';
t('R7 parseRows reads text and centre', () => {
  const rows = ocr.parseRows(OCR);
  assert.strictEqual(rows.length, 4);
  assert.deepStrictEqual({ x: rows[1].x, y: rows[1].y }, { x: 135, y: 1220 });
});
t('R7 findText: substring finds the first hit; exact does not take the longer line', () => {
  const rows = ocr.parseRows(OCR);
  assert.deepStrictEqual(ocr.findText(rows, 'วิดีโอ'), { x: 175, y: 1665 });
  assert.deepStrictEqual(ocr.findText(rows, 'วิดีโอ', { exact: true }), { x: 148, y: 1817 });
});
t('R7 findText honours the y band and returns null when absent', () => {
  const rows = ocr.parseRows(OCR);
  assert.strictEqual(ocr.findText(rows, 'ทั้งหมด', { minY: 1300 }), null);
  assert.strictEqual(ocr.findText(rows, 'ไม่มีข้อความนี้'), null);
});

// ---- R8 / R11 clips ----
t('R11 clipName pads the AC number and adds the part', () => {
  assert.strictEqual(clips.clipName({ key: 'OLS-1026', ac: 3, slug: 'create-forms', part: 2 }), 'OLS-1026_AC_03_create-forms_part2.mp4');
  assert.strictEqual(clips.clipName({ key: 'OLS-1026', ac: 12, slug: 'rotate' }), 'OLS-1026_AC_12_rotate.mp4');
});
t('R11 clipName refuses a bad key, AC or slug', () => {
  assert.throws(() => clips.clipName({ key: 'ols-1', ac: 1, slug: 'a' }));
  assert.throws(() => clips.clipName({ key: 'OLS-1', ac: 0, slug: 'a' }));
  assert.throws(() => clips.clipName({ key: 'OLS-1', ac: 1, slug: 'Bad Slug' }));
});
t('R11 one call is summed as base64: 6 MB fits, 6 MB + 3 MB does not', () => {
  const MB = 1024 * 1024;
  assert.strictEqual(clips.fitsOneCall([6 * MB]), true);
  assert.strictEqual(clips.fitsOneCall([6 * MB, 3 * MB]), false);
  assert.strictEqual(clips.fitsOneCall([8 * MB]), false);
});
t('R8 planSplit: a small clip stays whole, a large one is split with overlap', () => {
  assert.deepStrictEqual(clips.planSplit({ durationSec: 100, bytes: 1e6 }), [{ part: 0, start: 0, duration: 100 }]);
  const p = clips.planSplit({ durationSec: 150, bytes: 13 * 1024 * 1024 });
  assert.ok(p.length >= 3);
  assert.strictEqual(p[0].start, 0);
  assert.strictEqual(p[1].start, p[0].start + p[0].duration - 1);
  const last = p[p.length - 1];
  assert.strictEqual(last.start + last.duration, 150);
});
t('R11 compareReadback: equal passes; missing, wrong size, duplicate and extra are reported', () => {
  const local = [{ name: 'a.mp4', size: 10 }, { name: 'b.mp4', size: 20 }];
  assert.strictEqual(clips.compareReadback(local, [{ title: 'a.mp4', size: 10 }, { title: 'b.mp4', size: 20 }]).ok, true);
  const bad = clips.compareReadback(local, [{ title: 'a.mp4', size: 11 }, { title: 'c.mp4', size: 1 }, { title: 'c.mp4', size: 1 }]);
  assert.deepStrictEqual(bad.sizeMismatch, ['a.mp4']);
  assert.deepStrictEqual(bad.missing, ['b.mp4']);
  assert.deepStrictEqual(bad.duplicates, ['c.mp4']);
  assert.deepStrictEqual(bad.extra, ['c.mp4']);
  assert.strictEqual(bad.ok, false);
});

if (ran === 0) {
  console.error('superapp-test: no tests ran — that is a refusal, not a pass');
  process.exit(1);
}
console.log(`superapp-test: ${ran - failed}/${ran} passed`);
process.exit(failed ? 1 : 0);
