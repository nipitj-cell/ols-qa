# Spec — mobile-superapp-testing

Status: approved direction (owner 2026-11-13: "ทำสกิลนี้ให้หน่อย"; driver in this repo, with tests) · offline tools · the skill text is read by agents

## Why

One ticket family (a web app opened inside a SuperApp on an Android emulator) was tested four rounds
running with hand-written scripts. Every round re-learned the same failures (see
[method-draft.md](method-draft.md) §11). Rules that live only in a person's memory were broken twice:
the back key closed the mini-app and lost the session, and an evidence set was moved to the trash
without anyone naming who did it. The rules that can be checked by code are put in code; the rest are
written once in the skill.

## Rules

- **R1 Branch.** `testing-ticket-workflow` Phase A asks one more field, *Platform*. `Android SuperApp`
  selects the branch in `references/android-superapp-branch.md`; every other value runs the web path
  unchanged. Intake, the Phase C confirm gate, AC/EC coverage, verdict rules and the Jira step do not
  change.
- **R2 Device.** The device is resolved by AVD name on every run (serials change after a restart). The
  resolver refuses when zero or more than one running emulator has that name. A device is **busy** when
  `pidof screenrecord` on it returns a pid; the skill never touches a busy device or one intake did not
  name. One driver per device: a second session that needs the same device stops and tells the person.
- **R3 Preflight.** Before the first clip all of these pass, each with a printed measurement: device
  resolved · app in the foreground · WebView reachable (debuggable images only) · session live (the app's
  own authenticated API returns 200 from inside the page; a rendered screen is not proof) · role/mode
  correct · device settings recorded then set (`show_touches`, rotation) · keyboard frame measured. A
  preflight that cannot run is **BLOCKED** with the reason, never a pass.
- **R4 Forbidden inputs are refused by code.** The adb wrapper refuses `KEYCODE_BACK` (4), `ESC`
  (`KEYCODE_ESCAPE`, 111) and any `input text` while a login screen is the foreground. Leaving a filled
  form goes through the page's own ✕ and its confirm. The password is never typed, read or echoed.
- **R5 Coordinates.** CSS px → device px by `dpr`; `base` is the IME top while the soft keyboard is
  visible, else the screen height. Taps go only inside the tappable band; outside it the driver scrolls
  first. A target is tapped only when two reads 250 ms apart differ by ≤ 4 px. Scrolls are short and
  slow (≤ 550 px, 450–550 ms).
- **R6 Keyboard.** The IME frame is read from `dumpsys window`. A frame under 200 px high is the compact
  hardware-keyboard toolbar: the check *keyboard does not cover the field* is **BLOCKED** on that device,
  named, with what is needed (a device that shows the soft keyboard).
- **R7 Non-debuggable images.** When the WebView is not reachable (`ro.debuggable=0`, a Play Store
  image), taps are found by on-device OCR of a screenshot (text + center point, device px) and every tap
  is verified by reading the screen again. Page measurements (overflow, scroll end, API counts) that need
  the DOM are **BLOCKED** on that device, never estimated from pixels. A native-accessibility dump does
  not show WebView content and is not used for this.
- **R8 Recording.** One clip per AC, `screenrecord` (limit 175 s per file, stop by pid), touches shown,
  start from a clean state, hold ~1–1.5 s on each state a reviewer must read, end on the result. Clips
  that need more than 175 s are split into named parts by plan, not cut mid-state.
- **R9 Clip check.** Before delivery every clip is opened as an N-frame strip that includes the last
  frame. Reject and re-record when a step is missing, the target is off screen, a stale or wrong screen
  shows, a dialog is stuck, text landed in the wrong field, or the clip ends on a system dialog.
- **R10 Test data.** Default is to save nothing: forms are filled and left through the confirm. The run
  proves it with an API count before/after. A record is saved only when the person allowed it at the
  confirm gate, and it is named in the report. Action buttons in a detail (cancel publish, submit,
  delete) are not pressed unless the AC requires it.
- **R11 Upload.** The destination comes from intake (asked once, early). File names are
  `{KEY}_AC_{nn}_{slug}[_partN].mp4`. The browser upload bridge counts base64 and rejects a call over
  10 MB, so each file is sent in its own call and split when needed. After every upload the folder is
  listed and each name + byte size is compared with the local file. A same-name duplicate is replaced
  only when the person said so for that ticket; the old file goes to the trash, never a hard delete,
  and the report names it. Restoring from the trash is done in the storage's own UI, and a restore is
  checked by listing the folder.
- **R12 Revision loop.** A change request (faster, whole page, show taps, another sample, every
  type × status, another device) is restated as driver parameters; only the affected ACs are
  re-recorded; R8–R11 run again for the new files; the report says what changed, which files were
  replaced and any result that changed.
- **R13 Reporting.** Results of the chosen ACs come from measurement or from a frame strip, and the
  report says which. A frame-strip-only verdict is stated as such. Findings that look like defects are
  listed for the owner and never filed (global rule: no bug opened without the owner's say).
- **R14 Tools are measured.** `tools/superapp-test/` runs a known-answer self-test (one case that must
  be found/allowed and one that must not) before its answer is trusted, and its test file is part of
  the repo's suite list.

## Out of scope

- iOS, real devices, Play Store login flows, and any app that is not a WebView inside the SuperApp.
- Judging design (the Figma comparison stays in the existing workflow).
- Opening bugs, posting Jira comments (the person posts), publishing or deleting test content.

## Done when

- `tools/superapp-test/` tests pass with the repo's suite runner and refuse a run that measured none.
- `testing-ticket-workflow` Phase A and Phase D point at the branch reference; the reference holds
  R2–R13 in agent-readable steps; portability and link tests pass.
- One dry run on a fresh ticket reaches Phase C with the branch's intake fields filled.
