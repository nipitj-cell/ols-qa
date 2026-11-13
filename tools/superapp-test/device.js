'use strict';
// R2 — resolve a device by AVD name and never touch a busy one. Pure functions: callers feed them the
// text that `adb devices`, `adb -s <serial> emu avd name` and `adb -s <serial> shell pidof screenrecord`
// printed, so the rule is measurable without a device.

/** `adb devices` output -> [{serial, state}] for devices in state `device` only. */
function parseDevices(out) {
  return String(out || '')
    .split('\n')
    .slice(1)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [serial, state] = l.split(/\s+/);
      return { serial, state };
    })
    .filter((d) => d.state === 'device');
}

/** avdBySerial: { 'emulator-5554': 'Medium_Phone_API_35', ... } -> {ok, serial} | {ok:false, reason}. */
function resolveSerial(devices, avdBySerial, avdName) {
  if (!avdName) return { ok: false, reason: 'no-avd-name' };
  const hits = devices.filter((d) => avdBySerial[d.serial] === avdName);
  if (hits.length === 0) return { ok: false, reason: 'no-device' };
  if (hits.length > 1) return { ok: false, reason: 'ambiguous' };
  return { ok: true, serial: hits[0].serial };
}

/** `pidof screenrecord` output: any pid means somebody is recording on this device. */
function isBusy(pidofOut) {
  return /\d+/.test(String(pidofOut || '').trim());
}

module.exports = { parseDevices, resolveSerial, isBusy };
