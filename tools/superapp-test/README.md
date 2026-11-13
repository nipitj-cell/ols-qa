# tools/superapp-test

Helpers for the **Android SuperApp branch** of `testing-ticket-workflow`
([branch reference](../../skills/procedures/testing-ticket-workflow/references/android-superapp-branch.md),
spec: `docs/sdd/mobile-superapp-testing/spec.md`). Dependency-free Node ≥ 18 — pure functions fed with the
text that `adb` printed, so each rule is measurable without a device.

| Module | Rule | What it decides |
|---|---|---|
| `device.js` | R2 | resolve a serial by AVD name (refuses 0 or 2 matches); a pid from `pidof screenrecord` = busy |
| `guard.js` | R4 | refuses `KEYCODE_BACK`/4, `ESC`/111, and `input text` on a login screen |
| `coords.js` | R5 | CSS px → device px, tappable band, stable-before-tap, short scroll steps |
| `ime.js` | R6 | soft-keyboard frame from `dumpsys window`; a frame under 200 px is the compact toolbar (BLOCKED) |
| `ocr.js` | R7 | tap point from OCR rows when the WebView is not reachable |
| `clips.js` | R8, R11 | clip names, split plan, one-call upload limit (base64), read-back comparison |
| `swift/ocr.swift` | R7 | macOS Vision OCR → `text⇥x⇥y⇥w⇥h` rows (device px) |
| `swift/frames.swift` | R9 | N-frame strip of a clip, always including the last frame |

```bash
node tools/superapp-test/superapp_test.test.js   # known-answer self-test; part of the suite runner
```

The Swift helpers are macOS-only and optional: compile with `swiftc -O swift/ocr.swift -o ocr`
(each file on its own). Without them the branch says which checks are BLOCKED. Nothing here types a
password, opens a bug, or reaches a network host.
