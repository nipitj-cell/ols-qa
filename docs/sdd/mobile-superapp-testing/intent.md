# Intent — mobile-superapp-testing

Written in the originator's own words, before `spec.md`. Spec: docs/sdd/ai-native-sdlc-alignment R1.

## What is wanted

Turn the way a SuperApp (Android, WebView) ticket was tested on 2026-11-06 into a reusable skill path:
test through the real app on an Android emulator, record one clip per AC with taps shown, review the
work before delivery, ask where the evidence files should be uploaded, upload them named per AC, and
keep accepting change requests (faster, whole page, show taps, other sample, every type × status) that
re-record only the affected ACs. Owner, 2026-11-13: "ทำสกิลนี้ให้หน่อย".

## Why

The first rounds worked but cost hours on avoidable failures: a dead session that still showed data,
the app's back arrow closing the mini-app, ESC wiping a form, rotation only possible through the app
menu, the emulator keyboard shrinking the WebView, taps landing during scrolls, 180 s clip limits,
a 10 MB upload limit, clips delivered before anyone opened them, two sessions driving one device, and
an evidence set that vanished from the shared storage into the trash. Each became a rule in
[method-draft.md](method-draft.md); a skill makes the next round start from those rules instead of
rediscovering them.

## Constraints

- Extend `testing-ticket-workflow` as a platform branch; intake, the confirm gate, AC/EC coverage,
  verdict rules and the Jira step stay unchanged.
- Never type a password; the person logs in on the device.
- Never touch a device that intake did not name (another session may be using it); one driver per device.
- Save no test data unless the person allows it at the confirm gate; prove it with the API count.
- Upload only to the destination the person gives; replacing an older set needs a yes and goes to
  trash, never a hard delete; a same-name duplicate is replaced only when the person said so.
- Skill files in English, portable (placeholders only, no machine paths, no customer values);
  OLS-specific values go to the workspace guide.
- Driver code lives in this repo under `tools/superapp-test/` with tests (owner decision, 2026-11-13).
  Dependency-free Node ≥18; the macOS-only helpers (OCR, frame strip) ship as Swift source.

## Reviewed by owner on 2026-11-13

2026-11-13 — the owner asked for the skill after reading the draft and chose the in-repo driver; spec.md may now be written.
