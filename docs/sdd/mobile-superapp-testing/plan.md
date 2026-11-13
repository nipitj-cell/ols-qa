# Plan — mobile-superapp-testing

Spec: [spec.md](spec.md) · Intent: [intent.md](intent.md) · Draft: [method-draft.md](method-draft.md)

## Shape

Two PRs, in this order (the SDD gate wants the spec on `main` first):

1. **Docs PR** — `intent.md`, `spec.md`, `plan.md`, `tasks.md`, `method-draft.md`. No code.
2. **Code PR** — `tools/superapp-test/` (pure functions + tests + Swift helpers), the branch reference
   `skills/procedures/testing-ticket-workflow/references/android-superapp-branch.md`, the Phase A / Phase D
   pointers in `WORKFLOW.md`, the stub's *On trigger* line, the workspace-guide template row, and the
   OLS guide row for the SuperApp environment (placeholders only).

## Tools (dependency-free Node ≥ 18, one test file)

| Module | Pure function | Rule |
|---|---|---|
| `device.js` | resolve serial by AVD name; busy check | R2 |
| `guard.js` | refuse forbidden adb inputs | R4 |
| `coords.js` | CSS→device px, band, stable read, scroll step | R5 |
| `ime.js` | parse IME frame, compact detection | R6 |
| `ocr.js` | parse OCR rows, find text/exact, tap point | R7 |
| `clips.js` | file names, split plan, upload limit, readback compare | R8, R11 |
| `swift/ocr.swift`, `swift/frames.swift` | macOS Vision OCR; frame strip with last frame | R7, R9 |

## Risks

- The branch reference grows `testing-ticket-workflow` past its context budget → keep the branch in its
  own reference file, link from WORKFLOW, run `context_budget.test.js`.
- The portability scan rejects machine paths → use `{SERIAL}`, `{APP_PKG}`, `/sdcard/` device paths only.
- Swift helpers are macOS-only → documented as optional; the skill states what is BLOCKED without them.
