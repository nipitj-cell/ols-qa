# Method draft — testing a WebView app inside a SuperApp on an Android emulator

Status: **draft for review** — written from one real round (a "creator: course management" ticket,
2026-11-06). Input for a future skill change; nothing here is wired into any workflow yet.
Placeholders: `{KEY}`, `{APP_PKG}`, `{AVD_NAME}`, `{SERIAL}`, `{WEB_HOST}`, `{DRIVE_FOLDER_URL}`,
`{TEST_ACCOUNT}`. Real values live in the workspace guide / local secrets only.

---

## 1. What this adds to `testing-ticket-workflow`

A **platform branch: Android SuperApp (WebView)**. Intake, the Phase C confirm gate, AC/EC coverage,
verdict rules and the Jira step stay exactly as they are. What changes:

| Area | Web (today) | Android SuperApp (this draft) |
|---|---|---|
| Driving the UI | Playwright clicks in a browser | real touch input via `adb shell input …` on the emulator |
| Reading the page | Playwright locators | Chrome DevTools Protocol on the app's debuggable WebView (read-only + measurements) |
| Login | relink/mint commands | the person logs in on the device; Claude never types a password |
| Evidence | QA recorder (CDP screencast) | `adb shell screenrecord` per AC, with Android "show touches" on |
| Clip check | `verify_video.py` | frame strip extracted locally (AVFoundation) and opened before delivery |
| Upload | sheet / Jira | user-chosen Drive folder, named per AC, size read back |

---

## 2. Intake additions (ask once, in the existing Phase A message)

| Field | Example answer | Note |
|---|---|---|
| Platform | `Android SuperApp` | selects this branch |
| Device | `{AVD_NAME}` | resolve to `{SERIAL}` by AVD name every time — serials change after a restart |
| App build | read from the device | `dumpsys package {APP_PKG}` → versionName / versionCode; record it as the build id |
| Account | `{TEST_ACCOUNT}` (no password) | the person logs in on the device |
| VPN | required / not | |
| Evidence destination | `{DRIVE_FOLDER_URL}` or `none` | asked here so the end of the round never waits on it |
| Clip style | default: one clip per AC, touches shown | can be changed later on request (§9) |

---

## 3. Preflight (all must pass before the first clip)

1. **Device** — `adb devices -l` + `adb -s {SERIAL} emu avd name` = `{AVD_NAME}`. Another emulator may be
   running someone else's work: never touch a device that was not named in intake.
2. **Foreground app** — `dumpsys window | grep mCurrentFocus` shows `{APP_PKG}`.
3. **WebView reachable** — `adb forward tcp:<port> localabstract:webview_devtools_remote_<pid>`; pick the
   page whose URL starts with `https://{WEB_HOST}` (there is also an `about:blank` page — never use it).
4. **Session is live** — call the app's own authenticated API from inside the page and require HTTP 200
   with the expected user id. A rendered screen proves nothing: a stale page kept showing data while every
   request returned 401.
5. **Role/mode** — if the app opened in the wrong mode (e.g. learner instead of creator), switching mode
   through the app's own menu is part of the recorded path.
6. **Device settings for the round** (record the "before" values, restore them at the end):
   - `settings put system show_touches 1`
   - `settings put system accelerometer_rotation 0` and `user_rotation 0` (start in portrait)
7. **Keyboard** — tap a text field once and read the IME frame from `dumpsys window`
   (`type=ime frame=[0,TOP][W,H] … visible=true`). If its height is under ~200 px the emulator is showing
   the compact hardware-keyboard toolbar, not the soft keyboard → the "keyboard does not cover the field"
   check is **BLOCKED** on this device (name it; a cold-booted AVD showed the full keyboard).

---

## 4. Driving model

### 4.1 Coordinates

WebView CSS px → device px:

```
dpr  = devicePixelRatio                      (e.g. 2.625)
base = IME top (when the soft keyboard is visible) else screen height
top  = base - innerHeight * dpr              (status bar + app toolbar, ~210 px portrait)
x    = (rect.left + rect.width/2) * dpr
y    = top + (rect.top + rect.height/2) * dpr
```

The WebView **shrinks** when the keyboard opens (834 → 498 css px measured), so `base` must switch to the
IME top or every tap lands on the keyboard (swipe-typing garbage into the field).

### 4.2 Tap rules (each one fixed a real failure)

- One CDP connection for the whole flow; one `adb` call per action. Spawning a new process per step made
  every action take seconds.
- **Tappable band**: below the sticky dialog header (~580 px) and above the sticky footer (~2180 px) /
  IME top − 30. Outside the band → scroll first, never tap.
- **Stable before tap**: read the element position twice 250 ms apart; tap only if it moved ≤ 4 px.
  A tap during momentum scroll only stops the scroll.
- **Wait for overlays to finish closing** (drawers, pickers, the keyboard) before the next tap — wait on a
  DOM/IME condition, not a fixed sleep.
- **Scroll with short, slow swipes** (≤ 550 px, 450–550 ms). Fast long swipes fling past the target and
  the driver oscillates up/down.
- **Close a select/listbox** by tapping outside it (the dialog header area), not on text behind it.
- **Verify every step's effect** (e.g. "เลือก 1 รายการ" appears) and retry the tap at most 3 times;
  otherwise fail the step loudly.

### 4.3 Forbidden inputs

| Input | Why |
|---|---|
| The SuperApp's own back arrow / `KEYCODE_BACK` | closes the whole web mini-app; the session was lost once |
| `ESC` (`keyevent 111`) | closes an open form instantly with no "discard?" prompt — typed data lost |
| Typing a password / opening a login form | the person logs in; Claude stops at any login screen |

Use the page's own ✕ / menu / breadcrumb to navigate. Leaving a filled form must go through the app's
"ยืนยันออกจากหน้านี้"-style confirm.

### 4.4 Rotation

The app requests portrait at runtime (manifest has no `screenOrientation`; framework sets it). OS rotation
settings are ignored. Rotate through the **app's own menu** (⋮ → "rotate to landscape" / "back to
portrait") — this is also the real user path for the rotation AC.

### 4.5 Measurements recorded per step (no eyeballing)

- overflow: `documentElement.scrollWidth > innerWidth`, element `rect.right > innerWidth`
- text clipped without ellipsis (`scrollWidth > clientWidth` with `overflow:hidden`)
- keyboard: focused field bottom (device px) vs IME top → `covered: true/false`
- scroll reached end: `scrollTop >= scrollHeight - clientHeight - 2`
- list counts vs the app's API (per status tab, per page, all titles found across pages)
- data written: API record count before / after every step that could save

---

## 5. Recording

- `adb shell screenrecord --bit-rate 8000000 --time-limit 175 /sdcard/{file}.mp4`, **one clip per AC**
  (hard limit 180 s per file). Stop with `kill -INT <pid of screenrecord>` (by pid, never by name).
- Pacing: actions fast, but **hold ~1–1.5 s** on each state a reviewer must read (list loaded, page
  bottom, dialog top/bottom, result). Long pages: scroll ~half a screen, pause ~0.9 s, repeat.
- Start each clip from a clean state (page scrolled to top, no dialog open); end it on the result.
- Known limits: screenrecord keeps portrait dimensions, so landscape content appears as a small band;
  it writes no frames while the screen is static, so a clip can be shorter than wall time.
- **Open every clip before delivery**: extract N evenly spaced frames (always including the last) into
  one strip and look at it. Reject a clip if: a step is missing, the target is not on screen, a stale/
  wrong screen shows, an unrelated dialog is stuck open, or typed text landed in the wrong field.

---

## 6. Per-AC flow pattern (worked example: course management)

| AC | Recorded path | Measured / asserted |
|---|---|---|
| list | menu → (switch to creator if needed) → "course management" → status tabs → scroll each page to bottom → next page | counts per tab = API; all titles found; no overflow |
| detail | open one course per status (sample = 1 per AC on request) → scroll top→bottom slowly → back to top → ✕ | title/status = card = API |
| create form | open create → type each field → pick goal → pick grade → scroll to end | keyboard not covering each field; every field/button visible; scroll end reached |
| add lesson + media | add lesson → name → "add media" → wait list loaded → scroll picker to last item → pick a **published** item | item count = picker count; lesson shows "1 media" |
| drag reorder | collapse lessons → drag handle (motionevent DOWN/MOVE…/UP, no long-press pause) | order swapped; container `scrollTop` unchanged before/during/after |
| publish consent | "save and publish" → dialog → scroll to end → cancel → leave form with confirm | dialog fully readable; checkbox + accept visible; **accept never pressed**; API count unchanged |
| rotation | menu → landscape → scroll form → menu → portrait | every field value identical before/after |

Drag note: a pause after `DOWN` triggers WebView text selection instead of a drag — move immediately.

---

## 7. Test data policy

- Default: **save nothing**. Forms are filled and discarded; the run proves it with the API count.
- If an AC truly needs a saved record, ask once at the confirm gate (draft allowed or not); names follow
  the workspace test-data rules (real content, no "QA/test" words).
- App validations met during the run are expected behavior, not defects (e.g. "every media must be
  published before the course can be published") — pick valid data instead.

---

## 8. Upload to the evidence destination

1. Destination came from intake; if missing, ask once.
2. File names: `{KEY}_AC_{nn}_{short-slug}.mp4`; split parts `_part1…n`.
3. The browser upload bridge accepts **≤ 10 MB per file**. Split long clips by time and re-encode each
   part (`avconvert -p Preset1920x1080 --start S --duration D`); do not downscale to an unreadable size.
   Passthrough cuts do not work on screenrecord output (single keyframe).
4. Upload into a **new subfolder per re-record** so names never collide with an older set.
5. Read back: list the folder, compare every title + byte size with the local file. A drop that landed on
   an open preview/iframe uploads nothing — check, close the overlay, retry.
6. Replacing an older set: ask; on yes, move the old files to **trash** (recoverable), never hard-delete;
   list both folders afterwards.

---

## 9. Revision loop ("แก้ไขได้ตลอดตามสั่ง")

After delivery the person may ask for changes (faster, show the whole page, show taps, other sample,
other device). For each request:

1. Restate the change as a driver parameter (pace, scroll step, touches, sample, device).
2. Re-record **only the affected ACs**; keep the others.
3. Re-run the clip check (§5) and the upload/readback (§8) for the new files.
4. Report: what changed, which files were replaced, where the new set is, and any result that changed
   because of the re-run (e.g. a BLOCKED keyboard row became PASSED on a device with a full keyboard).

---

## 10. Review gate before delivery (self-check)

- [ ] Every AC has a clip + the measured values above; BLOCKED rows name the reason and what is needed.
- [ ] Every clip strip opened; none shows a stuck dialog, wrong field, login screen or stale page.
- [ ] Test data: API count unchanged (or the created record is named in the report).
- [ ] Device settings restored (`show_touches`, rotation).
- [ ] Upload readback matches; no duplicate names; old set handled as the person decided.
- [ ] Jira draft updated with any result that changed after a re-record.

---

## 11. Lessons from the first round (why each rule exists)

| What happened | Rule it produced |
|---|---|
| Screen showed data while API returned 401 | §3.4 session = API 200, not pixels |
| Back arrow closed the mini-app, session lost | §4.3 forbidden inputs |
| ESC closed the form, data lost | §4.3 |
| Rotation via OS settings did nothing | §4.4 rotate through the app menu |
| Emulator keyboard was a 63 px toolbar | §3.7 keyboard check / BLOCKED |
| Taps landed on the keyboard after WebView shrank | §4.1 `base` = IME top |
| Taps during momentum / closing drawers missed | §4.2 stable-before-tap, wait for overlays |
| Fast swipes overshot and oscillated | §4.2 short slow swipes |
| Listbox stayed open through a whole clip | §4.2 close by tapping outside; §5 strip check |
| Second run typed into a form left open by the first | start every flow with a "discard until no dialog" step |
| Clips cut at 180 s; one clip shorter than the steps | §5 one clip per AC, check every strip |
| Device restarted twice; a second emulator held another ticket's work | §3.1 resolve by AVD name, never touch others |
| Drive upload limit 10 MB; drops hit a preview iframe | §8 split + readback |
| Clips sent before being opened | §5 / §10 open every clip first |

---

## 12. Open decisions for the owner

1. Where the driver lives: in-repo `tools/` (with tests, generic) or off-repo `{QA_TOOLS_ROOT}`.
2. Whether this is a branch of `testing-ticket-workflow` (recommended) or a separate skill.
3. Default pace numbers (hold time, scroll step) — tune after one more round.
4. Whether `retest-bug-workflow` should reuse the same branch for SuperApp bugs.

## Appendix — driver building blocks (from the prototype)

| Helper | Does |
|---|---|
| `connect()` | CDP websocket to the `{WEB_HOST}` page of the WebView |
| `kbTop()` | IME top from `dumpsys window`, `null` when hidden/compact |
| `tapEl(expr, {band})` | scroll into band with short swipes → stable check → real tap |
| `waitFor(cond)` | poll a DOM condition, fail with the condition text |
| `scrollEnd()` / `scrollTopOf()` | real swipes until the dialog/page scroller reaches the end/top |
| `kbCheck(label)` | focused field bottom vs IME top → covered true/false |
| `rec.start/stop` | screenrecord per AC, stop by pid, pull the file |
| `DISCARD` | close ✕ / outside-tap / confirm until no dialog remains |
| `frames <mp4> <out> N` | AVFoundation frame strip incl. last frame, for the clip check |
