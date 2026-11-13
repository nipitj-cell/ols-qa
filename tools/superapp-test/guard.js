'use strict';
// R4 — inputs the driver must never send. The SuperApp's back key closes the whole mini-app (the
// session was lost once); ESC closes an open form with no confirm (typed data lost); a password is never
// typed. The wrapper that sends adb input calls this first.

const FORBIDDEN_KEYS = new Set(['4', 'KEYCODE_BACK', '111', 'KEYCODE_ESCAPE', 'BACK', 'ESCAPE']);

/**
 * args: the words after `adb shell`, e.g. ['input','keyevent','4'].
 * ctx.loginForeground: true when the foreground screen is a login form.
 * -> {ok:true} | {ok:false, reason}
 */
function checkAdbArgs(args, ctx = {}) {
  const a = (args || []).map(String);
  if (a[0] === 'input' && a[1] === 'keyevent') {
    const keys = a.slice(2).filter((x) => !x.startsWith('--'));
    for (const k of keys) {
      if (FORBIDDEN_KEYS.has(k.toUpperCase())) return { ok: false, reason: `forbidden-key:${k}` };
    }
  }
  if (a[0] === 'input' && a[1] === 'text' && ctx.loginForeground) {
    return { ok: false, reason: 'text-on-login-screen' };
  }
  return { ok: true };
}

module.exports = { FORBIDDEN_KEYS, checkAdbArgs };
