# Android SuperApp branch (testing-ticket-workflow)

## Contents

1. [Intake — extra fields](#1-intake--extra-fields-ask-once-in-the-phase-a-message)
2. [Device rules](#2-device-rules-r2) · 3. [Preflight](#3-preflight--every-item-prints-a-measurement-r3) · 4. [Forbidden inputs](#4-forbidden-inputs--enforced-by-guardjs-r4)
5. [Driving](#5-driving-r5) (5b: no DOM access) · 6. [Recording and clip check](#6-recording-r8-and-clip-check-r9) · 7. [Test data](#7-test-data-r10)
8. [Upload and read-back](#8-upload-and-read-back-r11) · 9. [Revision loop](#9-revision-loop-r12) · 10. [Report and review gate](#10-report-and-review-gate-r13) · 11. [Lessons](#11-lessons-why-each-rule-exists)

Use this branch when the ticket is tested **through a SuperApp on an Android emulator** (a web app shown in a WebView inside a native app). Everything else in [WORKFLOW.md](../WORKFLOW.md) stays: intake, the Phase C confirm gate, AC/EC coverage, verdict rules, the Jira step, no bugs opened here. Spec: `docs/sdd/mobile-superapp-testing/spec.md` (R1–R14). Driver helpers: `tools/superapp-test/` in the Helix repository (device resolve, forbidden-input guard, coordinates, IME frame, OCR rows, clip names/split/readback — each with a known-answer test); the macOS helpers `swift/ocr.swift` and `swift/frames.swift` are optional — without them say which checks are BLOCKED.

Placeholders: `{KEY}` `{APP_PKG}` `{AVD_NAME}` `{SERIAL}` `{WEB_HOST}` `{DESTINATION}` `{TEST_ACCOUNT}`. Real values come from the workspace guide; never write them into a committed file.

## 1. Intake — extra fields (ask once, in the Phase A message)

| Field | Note |
|---|---|
| Platform | `Android SuperApp` selects this branch |
| Device | the AVD name `{AVD_NAME}`; resolve it to `{SERIAL}` on every run (serials change after a restart) |
| App build | read from the device (`dumpsys package {APP_PKG}` → versionName/versionCode) and recorded as the build id |
| Account | `{TEST_ACCOUNT}` — no password; the person logs in on the device |
| Evidence destination | where the clips go (a Drive folder or `none`), asked **now** so the end of the round never waits on it |
| Duplicates | whether a same-name file in the destination may be replaced (old one to trash) — default: no |
| Clip style | default: one clip per AC, touches shown; changeable on request (§9) |

**Finding `{APP_PKG}` and `{WEB_HOST}`** (the workspace guide may hold only placeholders): with the app in the foreground, `{APP_PKG}` is the package in the `mCurrentFocus` line of `dumpsys window`; on a debuggable image `{WEB_HOST}` is the host of the page URL printed by `http://localhost:<port>/json` after the forward (§3.3); on a non-debuggable image read it from the workspace guide or ask. Record both in the workspace guide after the first run so the next round does not ask.

**Ticket type.** A Story with AC/EC is planned as usual. A **Bug** or a ticket with an empty description has no confirmed spec: the router sends a Bug to `retest-bug-workflow`; use this branch for it only when the person asks for a test run, plan only the scenarios the title supports, write no expected result of your own, and mark them `BLOCKED — no confirmed spec` (WORKFLOW Phase B) until the owner names the expected behaviour.

## 2. Device rules (R2)

- Resolve `{SERIAL}` by AVD name (`adb -s <serial> emu avd name`). Zero or two matches = stop.
- `adb` comes with the Android SDK platform-tools and is often not on `PATH`: use `$ANDROID_HOME/platform-tools/adb` (Android Studio → SDK Manager shows the SDK path) and say which one you used. `adb devices` listing nothing = no emulator is running: stop and ask the person to start the AVD from Android Studio's Device Manager; do not start emulators yourself and do not invent a serial (`device.js` returns `no-device`).
- A device is **busy** when `adb -s {SERIAL} shell pidof screenrecord` prints a pid, or another session is driving it. Never touch a busy device or one intake did not name. **One driver per device** — if you need it, tell the person.
- Never drive a device while another tool of yours (a survey, a script) is still running on it: stop it by pid first.

## 3. Preflight — every item prints a measurement (R3)

1. Device resolved and idle (§2).
2. App in the foreground (`dumpsys window | grep mCurrentFocus` shows `{APP_PKG}`).
3. WebView reachable (debuggable images): `adb forward tcp:<port> localabstract:webview_devtools_remote_<pid>`; choose the page whose URL starts with `https://{WEB_HOST}` (not `about:blank`). If `ro.debuggable=0` (Play Store image) the WebView is not reachable: use §5b and mark DOM measurements BLOCKED.
4. **Session live:** from inside the page call the app's own authenticated API and require 200 with the expected user (a rendered screen proves nothing — a stale page kept showing data while every request returned 401). On a device without DOM access, read the user's name and role on the profile/menu screen and say it was read from pixels.
5. Role/mode correct; switching mode through the app's menu is part of the recorded path.
6. Record the "before" values, then set: `settings put system show_touches 1`, `accelerometer_rotation 0`, `user_rotation 0`. Restore them at the end.
7. Keyboard: read the IME frame from `dumpsys window`. Under 200 px high = the compact hardware-keyboard toolbar → *keyboard does not cover the field* is **BLOCKED** on this device (name it).

A preflight item that cannot run is BLOCKED with the reason — never a pass. Report `device · build id · authenticated user id` before the first result.

## 4. Forbidden inputs — enforced by `guard.js` (R4)

| Input | Why |
|---|---|
| The app's back arrow / `KEYCODE_BACK` (4) | closes the whole mini-app; the session was lost once (and the system picker's back landed in a different app) |
| `ESC` / `KEYCODE_ESCAPE` (111) | closes an open form with no discard prompt — typed data lost |
| any `input text` on a login screen; any password | the person logs in; stop at a login screen |

Navigate with the page's own ✕, menu or breadcrumb. Leave a filled form through the app's "confirm leaving" dialog. If the mini-app does close, reopen it from the SuperApp home — ask the person which tile opens it the first time, then record it in the workspace guide.

## 5. Driving (R5)

- CSS px → device px: `top = base − innerHeight·dpr`, `base` = IME top while the soft keyboard shows, else screen height; the WebView shrinks when the keyboard opens.
- Tap only inside the band (below the sticky header ≈ 580 px, above the sticky footer ≈ 2180 px or IME top − 30; menus 300–2330). Outside the band: scroll first.
- **Stable before tap:** read twice 250 ms apart; tap only if the target moved ≤ 4 px. Wait for overlays (drawers, pickers, keyboard) to finish closing — on a condition, not a fixed sleep.
- Scroll with short, slow swipes (≤ 550 px, 450–550 ms); fast swipes oscillate. Close a listbox by tapping outside it.
- Verify every step's effect and retry a tap at most 3 times; then fail the step loudly.
- Rotate **through the app's own ⋮ menu** (OS rotation settings are ignored); this is also the real user path.
- Drag-reorder: `motionevent DOWN/MOVE…/UP` with no pause after DOWN (a pause starts text selection).
- Never press an action button in a detail (cancel publish, submit, delete) unless the AC requires it.

### 5b. No DOM access (non-debuggable image) (R7)

Take a screenshot (`adb exec-out screencap -p`), run `swift/ocr.swift`, find the text with `ocr.js` (`findText`, exact for short labels), tap its centre, then screenshot again to verify. Native accessibility dumps (`uiautomator dump`) do not show WebView content — do not use them. Use OCR rows to read counts and labels; page measurements that need the DOM stay BLOCKED. Filters/menus open sheets whose rows sit at different heights: look for the text in the sheet's band instead of using the main page's coordinates.

## 6. Recording (R8) and clip check (R9)

- `adb shell screenrecord --bit-rate 8000000 --time-limit 175 /sdcard/{file}.mp4`, one clip per AC; stop with `kill -INT <pid>` of screenrecord (by pid, never by name), then pull the file.
- Start from a clean state (top of page, no dialog); hold ~1–1.5 s on each state a reviewer must read; long pages: scroll ~half a screen, pause ~0.9 s, repeat; end on the result.
- A flow that needs more than ~175 s is planned as parts (`planSplit`) at state boundaries.
- **Open every clip before delivery** as an N-frame strip that includes the last frame (`swift/frames.swift`). Reject and re-record when: a step is missing, the target is off screen, a stale/wrong screen shows, a dialog is stuck, typed text landed in the wrong field, the clip ends on a system dialog (ANR, picker) or a login screen.
- Never run a whole flow blind in one go on a device you cannot read back: probe each screen once, then script it.

## 7. Test data (R10)

Default: **save nothing.** Forms are filled and left through the confirm; prove it with the API count before/after (or, without DOM access, the list count read from the screen). A saved record needs the person's yes at the confirm gate and is named in the report. App validations met during the run are expected behaviour — pick valid data. Test files (video, image, PDF, EPUB) are pushed to the device by the agent (`adb push` to the media folders) with QA-style names; no customer data.

## 8. Upload and read-back (R11)

1. Destination from intake (ask once if missing). Names: `{KEY}_AC_{nn}_{slug}[_partN].mp4` (`clips.js` `clipName`).
2. The browser upload bridge counts base64 and rejects a **call** whose files together exceed 10 MB → send **one file per call**; split long clips by time and re-encode each part (`avconvert -p Preset1280x720 --start S --duration D`); passthrough cuts do not work on screenrecord output.
3. Drops must land on empty space below the last row (a drop on a row or a preview uploads nothing); clear the drag overlay (reload the page) before the next file.
4. Read back: list the destination, compare every name + byte size with the local file (`compareReadback`); duplicates and missing files fail the step.
5. A same-name duplicate: replace only when intake said so — the old file goes to the **trash** (never hard-delete), and the report names it. Otherwise upload into a new subfolder per re-record. Trashing a folder or file never happens without a yes.
6. To **restore** from the trash, use the storage's own UI (the connector cannot untrash), then list the destination to confirm the files are back. When a set disappears, check the trash first (list with `trashed = true`); the metadata does not say who moved it — do not name anyone.

## 9. Revision loop (R12)

A request such as faster, whole page, show taps, another sample, every type × status, another device: restate it as driver parameters; re-record **only the affected ACs**; repeat §6 and §8 for the new files; report what changed, which files were replaced, and any result that changed (e.g. a BLOCKED keyboard row became PASSED on a device with a full keyboard). "Every type × status" is a matrix: read the real counts first (`จำนวน`/count text per combination), skip empty combinations by writing "none exists", never mark an empty one PASSED.

## 10. Report and review gate (R13)

- [ ] Every AC has a clip and says whether its result came from a **measurement** or a **frame strip**.
- [ ] BLOCKED rows name the reason and what is needed (e.g. soft keyboard, DOM access, a design tool).
- [ ] Every clip strip opened and clean; data count unchanged; device settings restored; no screenrecord left running.
- [ ] Upload read-back matches; duplicates handled as decided; trashed files named.
- [ ] Defect-looking observations are listed for the owner and **not** filed. The Jira comment is a draft the person posts.

## 11. Lessons (why each rule exists)

| What happened | Rule |
|---|---|
| Screen showed data while the API returned 401 | §3.4 session = API 200 |
| Back arrow / system back closed the mini-app, session lost | §4 |
| ESC closed the form, data lost | §4 |
| Rotation through OS settings did nothing | §5 rotate via the app menu |
| Keyboard was a 63 px toolbar | §3.7 BLOCKED |
| Taps landed on the keyboard after the WebView shrank | §5 `base` = IME top |
| Taps during momentum / closing drawers missed | §5 stable-before-tap |
| Fast swipes oscillated | §5 short slow swipes |
| Two sessions drove one device; a survey script ran during another session's run | §2 one driver per device |
| A blind script opened the wrong form, then a photo picker, then an ANR | §6 probe, then script; §6 reject clips that end on a system dialog |
| Non-debuggable image: nothing reachable by DevTools | §5b OCR taps, DOM checks BLOCKED |
| Upload call over 10 MB (summed) rejected the whole batch | §8 one file per call |
| A whole evidence set moved to the trash, mover unknown | §8 restore via UI; do not name anyone |
| Clips sent before being opened | §6 / §10 |
