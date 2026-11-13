<!-- ols-only: this file is never synced to the generic plugin. A skill or command that
     markdown-links to it ships a dangling link. Reference it as a plain path instead. -->
# OLS Project Guide

Project-specific config for all Helix workflows in this workspace.
AI reads this file before asking any OLS-related questions.

## Contents

- [Jira](#jira)
- [Confluence](#confluence)
- [Figma](#figma)
- [Qase (test management)](#qase-test-management)
- [Training-OLS smoke-test sheet](#training-ols-smoke-test-sheet)
- [QA tracking sheet (ticket list + TC status)](#qa-tracking-sheet-ticket-list--tc-status)
- [TC change format](#tc-change-format)
- [Customer UAT sheet (regression TC delivery)](#customer-uat-sheet-regression-tc-delivery)
- [Bug-status sync — `Bug report by HI` tab (hourly, added 2026-08-16)](#bug-status-sync--bug-report-by-hi-tab-hourly-added-2026-08-16)
- [Bug mirror — the `list` tab of our own regression sheet (`bugmirror_sync.py`)](#bug-mirror--the-list-tab-of-our-own-regression-sheet-bugmirror_syncpy)
- [HI bug-log watch — the two states nobody was watching (`hi_status_watch.py`, added 2026-09-03)](#hi-bug-log-watch--the-two-states-nobody-was-watching-hi_status_watchpy-added-2026-09-03)
- [Responsive test matrix — the `Responsive` tab of the QA tracking sheet](#responsive-test-matrix--the-responsive-tab-of-the-qa-tracking-sheet)
- [Test-type deliverable sheets — `sync-tc-result` (System / Integration / Unit)](#test-type-deliverable-sheets--sync-tc-result-system--integration--unit)
- [Screenshot evidence (Drive)](#screenshot-evidence-drive)
- [Bug ticket field schema (where the bug content actually lives)](#bug-ticket-field-schema-where-the-bug-content-actually-lives)
- [Dev session relink command](#dev-session-relink-command-login-by-command--verified-2026-11-10-post-mortem-0201)
- [Retest-bug QA notify](#retest-bug-qa-notify)
- [TC glossary (terminology source of truth)](#tc-glossary-terminology-source-of-truth)
- [Test Environment](#test-environment)
- [OLS domain — LP states & test-data recipes (learned OLS-26, 2026-07-13)](#ols-domain--lp-states--test-data-recipes-learned-ols-26-2026-07-13)
- [Content-detail click pitfall — two buttons named "บันทึก" (learned OLS-721 retest, 2026-09-24)](#content-detail-click-pitfall--two-buttons-named-บันทึก-learned-ols-721-retest-2026-09-24)
- [Comment list and replies — facts for test scripts (learned OLS-829, 2026-10-08)](#comment-list-and-replies--facts-for-test-scripts-learned-ols-829-2026-10-08)
- [Content name guard (ชื่อที่ผู้ใช้จริงเห็น) — pre-prod only, 11:00 + 17:00](#content-name-guard-ชื่อที่ผู้ใช้จริงเห็น--pre-prod-only-1100--1700)
- [Daily health check — pre-prod only, 12:00 and 18:00](#daily-health-check--pre-prod-only-1200-and-1800)
- [Default assignee / reporter](#default-assignee--reporter)
- [Preferred CSV format](#preferred-csv-format)

## Jira

| Field | Value |
|-------|-------|
| Domain | `<ORG>.atlassian.net` |
| Project key | `OLS` |
| Project ID | `10791` |
| Board ID | `818` |
| Board URL | https://<ORG>.atlassian.net/jira/software/projects/OLS/boards/818/backlog |
| QA test-ready query | Run this JQL in Jira issue search — candidate tickets for AI testing; pick those with **Status = READY TO TEST** and **TC Status = QA Reviewed**.<br>`parent in (OLS-3,OLS-4,OLS-5,OLS-6,OLS-7,OLS-17,OLS-9,OLS-8,OLS-12,OLS-11,OLS-1,OLS-2,OLS-10,OLS-13,OLS-14,OLS-15) AND issuetype in (Story, Bug, Task) AND (sprint in openSprints() OR sprint in futureSprints()) AND status in ("READY TO TEST","TESTING") ORDER BY created DESC`<br>*(the 16 epics are the Lot 1+2 set — widen the `parent in (…)` list for work outside those epics. This replaces saved filter `21323`, deleted 2026-08-16 in the filter cleanup; the query text is that filter's JQL verbatim.)* |

### Workflow statuses

| Status | Notes |
|--------|-------|
| To Do | Backlog |
| In Progress | Dev working |
| REVIEWING | PR / code review |
| DEPLOYING | Being deployed |
| READY TO TEST | QA pickup point |
| TESTING | QA in progress |
| BLOCKED | Blocked (dev or QA) |
| Done | Closed |

### QA lifecycle

1. Dev deploys → transitions to **READY TO TEST**
2. QA picks up → transitions to **TESTING**
3. Pass → transition to **Done** (or follow team convention)
4. Fail → create bug, transition ticket to **BLOCKED**

### Directed transitions (for retest-bug workflow)

| Transition | From → To |
|-----------|-----------|
| pick up by QA | READY TO TEST → TESTING |
| approve by QA | TESTING → Done |
| block | → BLOCKED — **not** offered from Done or BLOCKED (read via `GET /rest/api/3/issue/{ISSUE_KEY}/transitions` on 2026-10-07: 2 Done + 2 BLOCKED tickets, none listed `block`) |
| Deploy done | DEPLOYING → READY TO TEST |

Transition ids (global ids — availability depends on the current status, see below): `11` To Do · `21` In Progress · `31` REVIEWING ·
`41` Done · `51` DEPLOYING · **`61` READY TO TEST** · `71` TESTING · `81`/`141` BLOCKED ·
`151` approve by QA (→ Done). From READY TO TEST to Done use `121` then `41`.
Measured 2026-10-07 (`GET .../transitions`): from Done and from BLOCKED only `11` `21` `31` `41` `51` `61` `71` `81` are offered — `121`, `141` and `151` are not. Read the ticket's transitions before writing; never assume one is available.

### Retest-bug rules that belong to OLS, not to the skill (moved here 2026-09-05)

These eight rules used to sit in the retest skill's MUST/NEVER table, which is synced to the generic
helix plugin — so a transition id, an app URL shape and a UI-automation quirk from this project were
being shipped to every other project that installs the skill, against the skill's own Step 8a
("NEVER hardcode transition names") and `references/portable-content.md`. The skill now carries one
generic row telling the agent to read them from here. `tools/portability/portable_content.test.js`
fails if a value like this reappears under `skills/` or `commands/`.

| Rule | Because |
|------|---------|
| MUST use the two-step transition for READY TO TEST → Done: `121` then `41` | Single `151` fails; READY TO TEST cannot jump directly to Done |
| MUST transition a FAILED retest to In Progress (`21`), NEVER to BLOCKED | OLS workflow: BLOCKED = external block, In Progress = needs a dev fix |
| EXCEPTION — AI auto-test of READY TO TEST Bug/Task (`OLS_MODE=autotest`): a non-pass goes to **BLOCKED** with the comment "AI ทดสอบไม่ผ่าน รอ QA reproduce" — never FAILED, never In Progress, never a new bug | Owner decision 2026-10-05: an AI non-pass is unconfirmed until a QA reproduces it; the QA then moves it on. A harness failure (session/VPN/tool) leaves Jira untouched |
| MUST set `--pass-count N` + `--summary "Retest of dev fix"` + `--owner-label "QA Owner"` on every Discord retest notify | Defaults produce wrong output (0/0/0 + wrong label); learned from a 3-resend incident |
| MUST NOT use `await` in superpowers-chrome eval — use setTimeout + `window.__var` | `await` returns undefined; the callback pattern is required |
| MUST use a `mousedown` event (not `click`) for MUI Select / combobox elements | MUI Select ignores regular click events |
| MUST match OLS buttons by textContent, not by a generic CSS class | Generic selectors hit the wrong button (e.g. "สร้างสื่อ" instead of the target) |
| MUST NOT modify the DOM inside a MutationObserver callback | Causes infinite recursion → CDP crash |
| MUST use the singular OLS management URLs (`/creator/learning-path`, not `/learning-paths`) | Plural = 404; the API uses plural but the UI uses singular |

### Unblocking stories once a bug reaches Done (retest-bug-workflow Step 8d)

**Trigger = the bug is in Done** (Done means fixed). Ready-for-QA status for a story it was blocking =
**READY TO TEST** (transition `61`). Move the story **only** when every one of its "is blocked by"
links is in **Done** — OLS stories are commonly blocked by several bugs at once, and a blocker sitting
in **DEPLOYING** / REVIEWING / In Progress still counts as unresolved. Leave assignee and QA Owner
untouched.

Check the links from the **story** side (`is blocked by`), not just the bug's `blocks` list, so
blockers that this retest never touched are not missed.

### Assignee during QA

**Never change the assignee** when picking up an OLS ticket for retest or testing — not to self, not back to the developer after a verdict. Ownership is tracked by status, not assignee. This overrides the generic retest-bug-workflow Step 8b/8c (find developer → assign).

### AI Skill Adoption dashboard — every retest / testing-ticket close-out (owner, 2026-10-13)

| Field | Value |
|-------|-------|
| Dashboard | `<ADOPTION_DASHBOARD_URL>` — tab **AI Skill Adoption Overview** (real URL in local secrets only) |
| Refresh | every 5 minutes |
| How it counts | runs the tracker search `comment ~ "retestskillmarker"`; a ticket counts when one of its comments carries the usage marker and was created after the snapshot cutoff (older ones come from the snapshot) |
| Snapshot cutoff | `<ADOPTION_SNAPSHOT_CUTOFF>` (local secrets) — pass as `--cutoff` |
| Per-ticket check | `node tools/adoption-check/check.js --key OLS-<n> --cutoff <ADOPTION_SNAPSHOT_CUTOFF> --dashboard <ADOPTION_DASHBOARD_URL>` with `TRACKER_BASE_URL` / `TRACKER_EMAIL` / `TRACKER_API_TOKEN` from local secrets |

After the result comment is posted, the chat close-out says `Counted in <ADOPTION_DASHBOARD_URL> — tab AI Skill
Adoption Overview (dashboard refreshes every 5 minutes)` only when the check returns exit 0; otherwise it says
`NOT counted yet — <reason>`.

## Confluence

| Field | Value |
|-------|-------|
| Space | `PLUT` |
| OLS folder | https://<ORG>.atlassian.net/wiki/spaces/<CONFLUENCE_SPACE>/folder/<CONFLUENCE_FOLDER_ID> |
| Base URL | https://<ORG>.atlassian.net/wiki/spaces/<CONFLUENCE_SPACE> |

## Figma

| Field | Value |
|-------|-------|
| Working file | https://www.figma.com/design/<FIGMA_FILE_ID>/OLS_Working-file |
| Main frame | node-id `226-94221` |
| Access when Dev Mode MCP is off | Open the working-file URL in the **Chrome MCP** browser (`claude-in-chrome` — the QA Chrome login to Figma persists) → wait ~5–9s for the canvas to render → screenshot the node. Dismiss the "Want to view this file in Dev Mode?" modal with **Not now** (never Request access). This account = **View + Comment only** (toast "You can only view and comment on this file") — enough to view/screenshot/copy specs. `node-id` in the URL uses `-`; Figma `nodeId` uses `:` (`2257-114654` → `2257:114654`). Verified 2026-07-20 (node `2257:114654` = frame **AllContent-Guest**, page 💙 Learner Mode → คลังสื่อทั้งหมด). |

## Qase (test management)

| Field | Value |
|-------|-------|
| Project | `OLS` |
| Project URL | https://app.qase.io/project/OLS |
| FE TC Jira-format file | `Draft_Jira_{ISSUE_KEY}.csv` — 10-column Jira table schema; attached to story comment |
| FE TC Qase import file | `Import_Qase_{ISSUE_KEY}.csv` — Qase schema; attached to story comment alongside Draft_Jira (schema: `skills/procedures/tc-fe-prep-workflow/references/qase-import-format.md`) |
| Type values | `System Test` · `Unit Test` · `Integration Test` *(verify these exist as OLS custom Type values before import)* |
| Status value | `Done` *(verify exists as OLS custom Status value before import)* |
| Suite | reuse existing OLS suite; new suite only with user approval, never a duplicate |

## Training-OLS smoke-test sheet

Smoke-test case list + verdicts for the training-ols (prod) run. Resolve `<SMOKE_SHEET_ID>` from `~/.ols-qa-secrets/`.

| Field | Value |
|-------|-------|
| Sheet | `<SMOKE_SHEET_ID>` — tab **"OLS - Smoke test"** (gid `2040945190`), 112 cases |
| Columns | A Module · B Test case · C Pre-req · D Test data · E Test step · F Expected · **G/H/I = Training-ols69** status/img·VDO/Remark. *(Restructured 2026-08-09: the old pre-prod section was removed and Training-ols results moved from J/K/L to **G/H/I** — verified live: header `Training-ols69: Test Status / Image/VDO / Remark`, 81 verdicts in col G. **J/K/L are now empty/unused** — do not write them.)* |
| Write scope | verdict → **col G** · evidence link (`=HYPERLINK(folder,"Link")`) → **col H** · linked bug / remark → **col I**. Verdict = outcome-state shown in the capture (completeness gate), never "action done". Writer = `smoke_write.py` (scoped to G/H/I, RAW status + read-back). |

## QA tracking sheet (ticket list + TC status)

Master sheet of OLS tickets with QA/TC status. AI reads this to decide which tickets to test and to load each ticket's reviewed test cases. See workflow: [ai-assisted-testing-template.md](https://github.com/Thitic9203/ols-qa-evidence/blob/main/docs/ai-assisted-testing-template.md).

| Field | Value |
|-------|-------|
| Sheet | https://docs.google.com/spreadsheets/d/<QA_TRACKING_SHEET_ID>/edit?gid=528925434 |
| Summary tab `gid` | `528925434` (tab literally named **"Summary"**) — the ticket list for eligibility. Columns: Issue Type · parent · Key · Summary · Status · Ticket Detail Status · QA Owner · TC Status · Added to Regression Test Plan · Remark. *(Verified 2026-07-12 via Sheets API. Do NOT use gid `991559500` for ticket selection — that was the old "Test Progress - ALL TC" tab, now **deleted** 2026-07-24.)* |
| **Test Progress tab** | **`Test Progress - ALL TC - Revised`** (gid `1357987643`) — pass/fail rollup, one row per `OLS-*` tab. **Single-writer**: rebuilt atomically from source by `progress_build.py` (launchd every 5 min); **no other flow may write it**. Cols A–K = Ticket·QA Owner·Total·%Passed·NOT STARTED·TESTING·PASSED·PASSED WITH MINOR ISSUE·FAILED·BLOCKED·SKIPPED; **col L = "Need recheck and create bug"** = Yes when a **FAILED or PASSED WITH MINOR ISSUE** case's `Linked Bug` does not resolve to a **real Jira issue of type Bug** — empty cell, a placeholder like `Link` with no url behind it, a key that does not exist, or a key that turns out to be a Story/Task. Every key the cell mentions is read from the text **and from its rich-text hyperlink** (a cell often displays just `Link` while the url holds the key — invisible to the values API) and verified in Jira. BLOCKED never triggers it (a blocked case was never proven broken). Else No. *(changed 2026-07-27: PWMI added — a PWMI verdict always implies a non-High bug per the verdict rubric, so a PWMI case still missing a real Linked Bug (no `OLS-<n>` key, or one that resolves) now flags Yes too, same as FAILED. Before that, 2026-07-25: FAILED **or BLOCKED** with a merely non-empty cell)*; **col M = "Regression Test"** = `Regression Lot1` (the 37 selected stories) / `Regression Lot2`; **col O = "หมายเหตุ (สิ่งที่ยังติด/ยังไม่ 100%)"** (added 2026-08-02; widened to cover both lots 2026-08-04) = informational blocker note, written by the SAME single writer so it auto-rebuilds every run. Populated for a `Regression Lot1` **or** `Regression Lot2` story whose **col-D %Passed < 100%** (PWMI/Skipped count as passed, so a PWMI/Skipped-only story reads 100% and stays blank). Lists each non-PASSED case grouped by identical reason: FAILED/PWMI → linked Jira Bug + live status (a `Done` bug reads "รอ retest"), BLOCKED/SKIPPED → the case's Remark cell verbatim. Best-effort (`lot_notes()` returns `{}` on any error, never blocking the A:M write); the gate block was widened to `A1:O1000` so col O is owned/verified like the rollup. Junk in a note = junk in the source Remark cell (fix the cell, not the note). The legacy multi-writer tab (gid `991559500`) + the bound Apps Script + `progress_guardian.py` are retired. Full design: [progress-tab-single-flow.md](https://github.com/Thitic9203/ols-qa-evidence/blob/main/docs/progress-tab-single-flow.md). |
| **Backlog tab** | `Backlog` — mirror of the Jira board **Backlog** (issuetype ∉ {Epic, Subtask}), auto-rebuilt every **2 min** by an off-repo `backlog_sync.py` (launchd; Sheets+Jira read only, no VPN/LLM/cost; 5-layer gate, fail-closed on write / fail-open on Jira). Cols `Ticket · Type · Status · Summary` (Ticket → Jira). Any backlog ticket that **also has an `OLS-<n>` TC tab** is forced in the Revised tab to **`Need recheck and create bug` = No** and **`Regression Test` = No** — col M="No" auto-excludes it from the Summary % **and** the Remark (both key on col M), so backlog work never pollutes the QA rollup. Single-writer; do not hand-edit. Cache `backlog_keys.json` (off-repo) is what `progress_build.py` reads. |
| **MP4 / VDO tab** | `MP4-Sys, Int, Unit` (gid `89701294`) — evidence-capture rollup, **one row per deliverable VDO folder** (System 5 + Integration 5 + Unit 10 = 20 rows), footer `TOTAL` row of `=SUM` formulas below the last data row. Cols `A Type · B Tab · C folder link · D Total Case · E Total file · F Files Remaining · G Status`. **Single-writer = `vdo_sheet_sync.py` (off-repo), which counts Drive LIVE** — it lists each folder through the Drive API (`q="'<folder>' in parents and trashed=false"`, paged) and never trusts a cached manifest for the *file* side; `out/vdo_naming_manifest.csv` supplies only the expected filenames (the *case* side). Col C and the header row are never touched. **Do not hand-edit D–G** — run the tool; every `--apply` also re-asserts the tab's shape (row order, Status dropdown on **G only**, no validation stranded on the numeric F) and exits non-zero if that readback fails. Status vocabulary is read from the sheet's own `dataValidation` — `TO DO` · `WIP` · `DONE`, never invented. Sync after **every** batch that changes the folders, not once at the end — the user watches this tab live. |
| Per-ticket TC detail | click a ticket **Key** in the sheet → opens that ticket's own tab listing all its test cases |
| Eligibility for AI testing | **Status = `READY TO TEST`** AND **TC Status = `QA Reviewed`** |
| Ticket has no TC rows in sheet | TCs not yet pasted → tell user to update the sheet first; do **not** start testing |
| 🧬 **Integrity (บังคับ)** | เขียนแล้ว **สูตรห้ามพัง · ค่าห้ามเพี้ยน · ห้ามเลื่อนคอลัมน์** — หา column จาก header row (ห้าม hardcode) · ห้ามเขียนค่าดิบทับเซลล์ที่เป็นสูตร · เขียน **RAW** เสมอ (กัน `=…`/`1/2`/`007` ถูกตีความใหม่) · หลังเขียนต้องอ่านกลับมาตรง + ไม่มี `#REF!/#NAME?` ใหม่ + header ไม่ขยับ · ใช้ได้กับ **ทุก tab** ผ่าน `sheet_guard.py` |
| 🔐 **Write scope (บังคับ)** | AI เขียนได้เฉพาะแถวที่ **ว่าง/NOT STARTED** หรือแถวที่ **AI เขียนเองรอบก่อน** (Actual Result ขึ้นต้น `Tested by Claude AI`) · แถวที่ QA ใส่ status/actual/ลิงก์ไว้ = **ห้ามแตะ** · เขียนผ่าน `sheet_write.py` เท่านั้น มีสองโหมด: เขียนผลเทสลงแถวที่มีอยู่ (`--dry-run` ก่อน · ทุกแถวมี `"tc"` anchor) และ `--create-tab` สร้าง tab ใหม่ของทิคเกต (แถวถัดไป) **ห้ามยิง Sheets API เขียน tab TC เอง** — รายละเอียด 3 ชั้น: [ai-assisted-testing-template.md § Write-scope guard](https://github.com/Thitic9203/ols-qa-evidence/blob/main/docs/ai-assisted-testing-template.md#-write-scope-guard--ai-แตะได้เฉพาะงานของรอบตัวเอง-3-ชั้น--บังคับ) |
| **Create the per-ticket TC tab** | ใช้หลัง draft TC ได้รับอนุมัติ (tc-fe-prep Step 6.5) · รัน `python3 ~/ols-qa-testing-bot/sheet_write.py --create-tab {ISSUE_KEY} --rows <Draft_Jira CSV หรือ Sheet_Tab JSON> --sheet <QA_TRACKING_SHEET_ID> --qa-owner "<QA Owner alias>" --dry-run` ก่อน แล้วรันซ้ำโดยไม่มี `--dry-run` · sheet id อ่านจาก `~/.ols-qa-secrets/` ห้ามพิมพ์ลงแชทหรือไฟล์ · `--qa-owner` ใส่ alias ใน dropdown (`QA Owner A`–`QA Owner D`) ของ QA Owner ประจำทิคเก็ต (Summary tab คอลัมน์ QA Owner) ไม่ใช่ชื่อเต็มแบบ Summary tab (ดูแถว "QA Owner dropdown = Table-managed") · ชื่อจริงของแต่ละ alias อยู่ใน `~/.ols-qa-secrets/` เท่านั้น · `--create-tab` มีหลัง ols-qa-testing-bot PR #5 merge แล้วเท่านั้น ก่อนหน้านั้นจะได้ usage error (exit `2`) · สิ่งที่สร้างมีแค่: tab ชื่อตรงกับ key · หัว 16 คอลัมน์แบบ OLS-44 · แถวที่เขียนเป็นข้อความล้วน (`stringValue` เท่ากับ RAW) · Table object ซึ่ง dropdown (Test Status และ QA Owner ถ้ามี) คัดลอกจาก tab `OLS-44` ตอนรัน · ถ้ามี tab ชื่อนี้อยู่แล้วจะปฏิเสธ · tab ใหม่ใช้ Test Status ได้แค่ `NOT STARTED` หรือ `BLOCKED` (ตัวพิมพ์ใหญ่ตาม dropdown) · ไม่แตะ Test Progress · อ่านกลับผ่าน `sheet_guard.py` · tab + แถว + Table ส่งใน `batchUpdate` เดียว ซึ่ง API ทำแบบได้ทั้งหมดหรือไม่ได้เลย จึงไม่มี tab ค้างครึ่งทาง · exit `0` = สร้างและอ่านกลับตรง · `3` = ปฏิเสธ หรือ request ถูกปฏิเสธและอ่านซ้ำแล้วยืนยันว่าไม่ได้สร้างอะไร · `4` = tab อาจมีอยู่แต่ยังพิสูจน์ไม่ได้ว่าถูก (อ่านกลับไม่ได้หรือไม่ตรง) ผลลัพธ์มี `next_step` · วิธีกู้: เปิด tab เช็คว่า gid ตรงกับในข้อความ (ห้ามลบ tab ที่ gid อื่น) เทียบกับ dry-run ถ้าผิดให้ QA Owner ของทิคเก็ตตกลงก่อน แล้ว user ลบ tab นั้นด้วยมือ แล้วรันขั้นนี้ใหม่ (รันซ้ำจะถูกปฏิเสธตราบที่ tab ยังอยู่ และ `progress_build.py` จะรวม tab นี้เข้า Test Progress ทุก 5 นาทีจนกว่าจะลบ) |
| **Jira-side `TC Status`** | Separate from the Sheet's `TC Status` column above — a real Jira custom field on the story, `customfield_12128` (name **"TC Status"**, type `option`). Allowed values: `TO DO` / `IN PROGRESS` / `BLOCKED` / `DONE` / `QA REVIEWED` / `NOT REQUIRED`. Set via `PUT /rest/api/3/issue/{key}` with `{"fields":{"customfield_12128":{"value":"QA REVIEWED"}}}` — a **field edit, not a comment**, so it does not violate a "don't comment on Jira" instruction. When TC review is done, flip **both** the Sheet's Summary!TC Status cell AND this Jira field to `QA REVIEWED` — they are two independent stores of the same status and must be kept in sync manually. |
| 🚧 **Unclear spec → BLOCKED + actionable Remark (บังคับ, ห้ามตกหล่น)** | ตอนรีวิว/ร่าง TC ถ้าเจอจุดที่**ไม่ชัวร์** (AC ขัดแย้งกันเอง, ขัดกับ Key Feature/PRD/Figma, อ้างอิงทิคเก็ตอื่นที่ยังไม่ยืนยัน, comment mis-thread) → **ห้ามมั่ว ห้ามเดา** — ตั้ง **Test Status = `BLOCKED` เฉพาะเคสนั้น** (ไม่ block ทั้งตั๋ว) + เขียน Remark บนแถวเคสนั้นตามฟอร์แมต: `⚠️ BLOCKED — QA Owner (<alias เช่น QA Owner A>) ติดต่อ <ชื่อคน เช่น PO> เพื่อยืนยัน: <ประเด็น อ้าง AC/EC label> · ได้คำตอบแล้วจึงปรับ TC และรันได้` — **actor = QA Owner เป็นคนไปติดต่อ** (ห้ามเขียนแค่ "รอ X" แบบไม่มีคนทำ) · contact target = Reporter/PO ตัวจริงของตั๋ว (ดูจาก Jira field `reporter`) · ทุก uncertainty ที่เจอในรีวิวต้องจบเป็นแถว BLOCKED ในชีต — ห้ามมีที่พูดไว้ในแชต/รายงานแต่ไม่ลงชีต |
| **QA Owner dropdown = Table-managed (gotcha)** | Every per-ticket TC tab is a **Google Sheets "Table" object** (`spreadsheet.tables`), not a plain range. Classic `setDataValidation` on the QA Owner column (K) fails with `400 "not allowed on cells in typed columns"`. Fix: use `updateTable` with `table.columnProperties[{"columnIndex":10,"columnType":"DROPDOWN","dataValidationRule":{...}}]` and `fields: "columnProperties(columnType,dataValidationRule)"` instead. The dropdown's option list uses **short aliases** (`QA Owner A`, `QA Owner B`, `QA Owner C`, `QA Owner D`), not the full `"Name (Nick, ไทย)"` form used in the Summary tab — write the alias into the QA Owner cell, and add a missing person's alias to the option list via the same `updateTable` call (additive, never remove existing options). A freshly `addSheet`-created tab is a plain grid until someone converts it to a Table in the UI — it has no dropdown to update yet. A tab made by `sheet_write.py --create-tab` is a Table from the start. |

### Every-5-minute live-Drive sync into the MP4 tab — a **temporary, self-expiring** job (2026-08-16)

`vdo_sheet_sync.py` was a hand-run script; the user asked for it on a **5-minute** schedule so the
tab tracks Drive while a capture batch is in flight. The job is **deliberately time-boxed** — it
ends at a wall-clock cutoff and then deletes itself. Pieces (tool + plist are off-repo):

| piece | what it is |
|---|---|
| `~/ols-qa-testing-bot/run_vdo_sheet_sync.sh` | the wrapper: checks the cutoff, then runs the work through the SFD harness (`sfd/run_workflow.sh`, watchdog 240 s < the 300 s interval so runs cannot pile up) |
| `com.thitichaya.ols-vdo-sheet-sync` | launchd, `StartInterval 300`, `StandardErrorPath` **=** `StandardOutPath` (SFD Level 3 — split streams make a failure alert fire with no reason attached) |
| `~/ols-qa-testing-bot/logs/vdo_sync_until.epoch` | the cutoff, one epoch integer. First run of this job: **2026-08-16 13:00** |
| `sfd/workflows.json` | registered `periodic` / `interval_s 300` — a new job with no net is not allowed |

**Teardown order matters, and it is the wrapper's job, not a human's.** At the cutoff it (1)
removes its own label from `sfd/workflows.json`, (2) retires the plist to `*.expired-<stamp>`,
(3) boots itself out — in that order. A label left in the registry after the job is gone makes the
heartbeat page `rc=unloaded` forever for work nobody intends to run, which is exactly how a real
alert gets trained into noise. A missing/unreadable cutoff file is **fail-closed**: it fires the
loud notifier and tears down rather than running on indefinitely.

**Verify the teardown branch by running it, not by reading it** — set the cutoff to a past epoch,
run the wrapper once, confirm all three (registry entry gone · plist retired · `launchctl list`
empty), then restore and re-bootstrap. Done 2026-08-16; the branch works.

**Reviving it for another batch:** restore the plist name, re-add the registry entry, write a fresh
cutoff epoch, `launchctl bootstrap gui/<uid> <plist>`. Never leave it armed with no cutoff.

## TC change format

Values for the Helix `tc-change-format-workflow` (copy a ticket's TC tab into the release TC template, then record the delivered file in the tracking sheet). Moved out of the skill 2026-11-03 so the skill stays portable; the rules below are the ones the work owner set on 2026-10-17/18.

Sheet, folder and template IDs and the owner e-mail map are **not** kept in this public repo — resolve them from `~/.ols-qa-secrets/`, or ask the user and save them there.

| Value | OLS setting |
|---|---|
| `{TC_TEMPLATE_SHEET}` | `<TC_TEMPLATE_SHEET_ID>` (Google Sheet, one tab) |
| `{TC_RELEASE_ROOT_FOLDER}` | `<TC_RELEASE_ROOT_FOLDER_ID>` — sub-folders named `Release <DD>_<Mon>` |
| `{TC_OWNER_EMAIL_MAP}` | off-repo only (`~/.ols-qa-secrets/`) |
| `{TC_TRACKING_SHEET}` | `<TC_TRACKING_SHEET_ID>` (customer-facing — never edit existing rows unasked) |
| `{TC_TRACKING_BUG_TAB}` | `Bug reported by HI` |
| `{TC_TRACKING_CR_TAB}` | `CR` |
| `{TC_TRACKING_IMPROVEMENT_TAB}` | `Improvement by SKL` |
| Column mapping | skill default (13 columns) |

### `{TC_TRACKING_COLUMN_RULES}`

The same rule applies to the matching header in every tab. Headers are matched by name, never by letter.

| Column | Rule kind | Value |
|---|---|---|
| Improvement Name | card summary | Jira `summary` |
| Jira (Ticket improvement) | card key | key linked to the Jira issue |
| Bug (ที่ SKL พบเอง) | empty | — |
| Ticket status | fixed value | `PASSED ON PRE-PROD` |
| QA Owner | owner | people chip of the TC owner |
| TC Status | fixed value | `TC Delivered to HI-QA` |
| Test Result Status | fixed value | `Test Result Delivered to HI-QA` |
| TC and Test result link | TC file link | label `Link`, linked to the new TC file |
| วันสุดท้ายในการส่ง TC & Test Result ให้ลูกค้า | empty | — |
| Demo · UAT | same release | copied from rows whose TC link points to a file in the same release folder; none → ask |
| Production Release | release date | e.g. `Release 04_Nov` → 4 Nov of the current year, as a real date |
| TC Approval Status by HI | fixed value | `TO DO` |
| Comment from HI (both) | empty | — |
| No (CR tab) | next number | highest whole number in the column + 1 |
| CR Name · Jira (Story) (CR tab) | card summary · card key | as Improvement Name · Jira |
| Summary · SKL Ticket (bug tab) | card summary · card key | summary · key linked to Jira |
| Module · HI Ticket · Latest progress · Note after recheck · UAT by HI (bug tab) | ask | no rule yet |

## Customer UAT sheet (regression TC delivery)

Customer-facing regression sheet — HI-QA runs delivery-gate regression from it.

> 🔴 **Regression run routing (บังคับ — เมื่อรอบนั้นคือ regression):** ถ้ารอบที่กำลังจะเทสคือ **regression** →
> - **Test cases มาจากชีทนี้เท่านั้น** — `<CUSTOMER_UAT_SHEET_ID>` (tab `OLS: TC List (Lot1)` / `OLS: TC List (Lot2)`; ชื่อเดิม `OLS: TC List` ถูก rename เป็น `(Lot1)` ตอนเพิ่ม Lot2).
> - **อัปเดตผลลง `<CUSTOMER_UAT_SHEET_ID>` เท่านั้น — ห้ามไปเขียนชีทอื่น** (ห้ามแตะ QA tracking sheet `<QA_TRACKING_SHEET_ID>`, Test Progress, per-ticket TC tabs, sync-tc-result deliverables — ทั้งหมดนั้นเป็นของ flow per-ticket ไม่ใช่ regression).
> - **หลักฐานการทดสอบ regression ลงโฟลเดอร์ Drive `<EVIDENCE_DRIVE_FOLDER_4>` เท่านั้น** (regression evidence) — **ไม่ใช่** `<EVIDENCE_DRIVE_ROOT_ID>` (`Capture screen (OLS)`) ที่เป็นของ per-ticket. โครง = **แยกชั้น verdict (`PASSED`/`FAILED`/`BLOCKED`) ก่อน แล้วแยก subfolder ต่อ Test Case ID**: `<EVIDENCE_DRIVE_FOLDER_4>/<PASSED|FAILED|BLOCKED>/<TC-ID>/<files>` (`drive_upload.py --parent <EVIDENCE_DRIVE_FOLDER_4> --verdict <PASSED|FAILED|BLOCKED> --tc <TC-ID> …`). **ใช้ชื่อ verdict ตัวพิมพ์ใหญ่เสมอ** ให้ตรงกับโฟลเดอร์เดิมของลูกค้า (มี `PASSED`/`FAILED`/`BLOCKED` อยู่แล้ว) — `drive_upload.py` guard เทียบ case-sensitive จึงต้องส่งตัวใหญ่ ไม่งั้น error `resolved folder is named 'PASSED', expected 'passed'`. *(แก้จากบันทึกเก่าที่ระบุ lowercase — ของจริง 2026-08-09 = UPPERCASE)*.
> - รอบ per-ticket (ปกติ) → ใช้ QA tracking sheet + `<EVIDENCE_DRIVE_ROOT_ID>` ตามเดิม. **ห้ามสลับปลายทางข้ามกันเด็ดขาด.**
> - 🔤 **Canonical wording (บังคับ — ห้ามหลุด):** ตอน sync รายละเอียด TC (cols B–G) เข้าชีท regression **ต้องแทน token `<LEGACY_SSO_NAME>` → `NDLP` เสมอทุกจุด** (ชื่อระบบภายในเก่า ห้ามหลุดเข้า customer-facing rows). resolve `<LEGACY_SSO_NAME>` จาก `~/.ols-qa-secrets/` — บังคับอัตโนมัติแล้วผ่าน `canon()` ใน `regression_sync.py` / `lot2_regression_sync.py` / `lot2_regression_auto.py` (regex standalone-token, กัน false positive แบบ "ato·_·lly"; Thai-adjacent ยัง rewrite). แก้/เพิ่ม sync path ใหม่ต้องพา `canon()` ไปด้วย.
> - 🧊🔴 **ทั้ง Lot1 และ Lot2 = ส่งมอบแล้วและแช่แข็ง (เจ้าของสั่ง 2026-08-15) — ห้าม workflow ใดเขียนอีก:** ตรวจสดวันนั้นได้ `OLS: TC List (Lot1)` = **PASSED 122/122** · `OLS: TC List (Lot2)` = **PASSED 125/125** ไม่มีสถานะอื่นเหลือ จึงไม่มีอะไรให้ sync อีก. 🔴 **แก้ตัวเลข 2026-09-03: 122 กับ 125 คือ *จำนวนแถวรวมหัวตาราง* ไม่ใช่จำนวนเคส** — อ่านสดวันนี้ได้ **Lot1 = 121 เคส · Lot2 = 124 เคส** (แถวข้อมูลที่ไม่ว่าง) ยัง PASSED 100% ทั้งคู่เหมือนเดิม. 🔴 **สองแท็บ layout ไม่เหมือนกัน — Lot1 ไม่มีคอลัมน์ `SKL-QA Bug`**: Lot1 คือ `H SKL-QA Test Status · I SKL-QA QA Name · J SKL-QA Image/VDO · K SKL-QA Remark · L HI-QA Test Status - Chrome` ส่วน Lot2 คือ `… J SKL-QA Image/VDO · K SKL-QA Bug · L SKL-QA Remark` → **เครื่องมือใดที่ hardcode K=Bug จะอ่านผิดช่องบน Lot1** ต้อง resolve จาก header ของแท็บนั้นเสมอ (กฎเดียวกับ PM-010). บังคับที่ตัวโค้ดแล้ว: `lot2_cols.assert_not_frozen()` ปฏิเสธทั้งสองแท็บ (รวมชื่อเก่า `OLS: TC List`) และ `resolve()` เรียกมันก่อนเสมอ → เครื่องมือที่ผ่านโมดูลนี้ทุกตัวหยุดทันที (`reg_lot2_write.py` · `pp_write.py` · `pp_update_pwmi.py` · `pp_fix_klinks.py` · `lot2_regression_auto.py` · `lot2_regression_sync.py` · `_reg_renumber.py` · `lot2_trim_*.py`) · `regression_sync.py` (seeder ของ Lot1) `raise` ตั้งแต่ต้น `main()`. ไม่มี launchd job ไหนเรียกไฟล์เหล่านี้แล้ว (plist ของ `lot2-regression-auto` ถูก disable ตั้งแต่ 2026-08-10). ถ้า **คน** จำเป็นต้องแก้จริงๆ ให้รันครั้งเดียวด้วย env `OLS_UAT_UNFREEZE='<ชื่อแท็บ>'`. เทสกันถอยหลัง: `tests/test_lot2_cols.py` (`--live` เช็ค header จริงด้วย)
> - 🔤 **Column layout (Lot2) — อ่านจาก header row เสมอ ห้าม hardcode:** ตรวจสดเมื่อ **2026-08-15** ได้ `A` No. · `B` Module · `C` Test case name · `D` Pre-requisite · `E` Test data · `F` Test step · `G` Expected Result · **`H` SKL-QA Test Status** · `I` SKL-QA QA Name · **`J` SKL-QA Image/VDO** · `K` SKL-QA Bug · `L` SKL-QA Remark · `M`/`N` HI-QA Test Status (Chrome/Edge) · `O` HI-QA QA Name · `P` HI-QA Image/VDO. ⚠️ **เลื่อนไปจากบันทึกเดิม 1 คอลัมน์** (เดิมจดว่า status = col I) — เครื่องมือ off-repo ที่เคย hardcode `I`=status / `K`=link / `L`=bug / `M`=remark จะเขียนผิดช่องและ **ดัน remark ไปทับคอลัมน์ของ HI-QA**. **แก้แล้ว 2026-08-15:** ทุกตัว resolve คอลัมน์จากชื่อหัวตารางผ่าน `lot2_cols.py` (`idx()` fail-closed ถ้าไม่เจอชื่อ · `assert_not_hi_qa()` หยุดทันทีถ้าปลายทางเป็นคอลัมน์ HI-QA · `last_idx()` ขยายช่วง block ให้คลุมคอลัมน์ key) และ `lot2_regression_auto.py` ผูก `CI_STATUS`/`KEY_COL`/`BLOCK_LAST` ตอนรันด้วย `bind_columns()` แทนค่าคงที่ `8`/`20`. ลิงก์หลักฐานใน `J` ใช้รูปแบบ `=HYPERLINK("https://drive.google.com/file/d/<ID>/view","Link")` (แสดงคำว่า `Link`).
> - 🧊 **Frozen PASSED rows (Lot2 — บังคับ):** เคสใน `OLS: TC List (Lot2)` ที่ **col H** " SKL-QA Test Status" = **`PASSED` แล้วเท่านั้น** **ห้าม re-sync/เขียนรายละเอียดทับเด็ดขาด**. เหตุ (user 2026-08-05): ผล PASSED ถูกบันทึกไว้กับ detail เวอร์ชันตอนเทส — detail ต้นทางเปลี่ยนแล้วซิงก์ทับ = ขัดกับผลที่ผ่านไปแล้ว. **freeze เฉพาะ `PASSED`** — สถานะอื่น (`FAILED`/`BLOCKED`/`PASSED WITH MINOR ISSUE`/`READY TO TEST`/`NOT STARTED`/ว่าง) ยัง sync detail ทับได้ เพราะเดี๋ยวต้องเทสใหม่จนผ่านอยู่ดี (ควรได้ detail ล่าสุดก่อนเทสรอบผ่านด้วยซ้ำ). บังคับแล้ว: `lot2_regression_auto.py` append-only (เขียนแถวใหม่ใต้ last row + gate เช็ค landing ว่าง + frozen-key assert) → แถว PASSED ไม่มีทางโดนแตะ; `lot2_regression_sync.py` (curated seeder, retired) มี guard ปฏิเสธทั้ง write ถ้าเจอแถวใด `PASSED`. predicate = `col_H.strip().upper() == "PASSED"` (เดิมเขียนว่า `col_I` — ผิดตั้งแต่ layout เลื่อน ดูหัวข้อ Column layout ด้านบน).

| Field | Value |
|-------|-------|
| Sheet | https://docs.google.com/spreadsheets/d/<CUSTOMER_UAT_SHEET_ID>/edit |
| **Regression evidence Drive** | `<EVIDENCE_DRIVE_FOLDER_4>` → https://drive.google.com/drive/folders/<EVIDENCE_DRIVE_FOLDER_4> — regression evidence ลงที่นี่เท่านั้น · โครง `<PASSED\|FAILED\|BLOCKED>/<TC-ID>/<files>` (แยกชั้น verdict ก่อน แล้วต่อ TC-ID). **verdict bucket = ตัวพิมพ์ใหญ่ `PASSED`/`FAILED`/`BLOCKED`** ให้ตรงกับโฟลเดอร์เดิมของลูกค้า (มีอยู่แล้วทั้ง 3 · `drive_upload.py` guard เทียบ case-sensitive → ส่ง lowercase จะ error เพราะไปชนโฟลเดอร์ `PASSED` เดิม). TC-ID subfolder เดิม = `<ticket>_TC_<n>_No<NN>`; เคสที่ไม่มี ticket ใช้ `No<NN>`. |
| OLS tab | `OLS: TC List (Lot1)` (gid `2084955184`; renamed from `OLS: TC List`) + `OLS: TC List (Lot2)` (gid `1568233273`) — cols B–G = Module · Test case name · Pre-requisite · Test data · Test step · Expected Result. **Only B–G are ours**; col A (No.) pre-filled, cols H+ = SKL-QA/HI-QA tester columns — never touch. Other tabs (ELMS/CBMS/EvMS/…) never touch. |
| **Delivery rounds** | Round 1 = the **9 modules** that carry TCs (Media List and View · Media Management · Course Management · Learning Path Management · Profile Page · Recommendation System · User Moderation · Content Management · Social Interaction). The other **7** modules listed in the `OLS: Summary` tab (Integration NDLP · Authentication · User Management · Live Streaming · Achievement/badge · Backoffice CMS · Report/Stat/Dashboard, all `NOT STARTED`) are **round 2 by plan — not a coverage gap**. Scope any coverage audit to the 9 round-1 modules; do not report the other 7 as missing. |
| **Trimmed to 125 (2026-07-24)** | Pre-delivery cut 307 → **125** cases, No. renumbered 1–125. Only rows still `READY TO TEST` were deleted; every row already carrying a verdict (PASSED/FAILED/SKIPPED, 32 rows + their evidence links) was untouched. Selection = happy path + core lifecycle + main validation per feature; status-permutation duplicates reduced to one representative each. Coverage was re-reviewed afterwards and 7 cases swapped back in to close zero-coverage concerns (consent-not-accepted, permission-negative on another creator's content, status-filter tabs, duplicate vote, admin reported-list, LP publish with an unavailable course). **Before appending anything (e.g. `regression_sync.py`), re-check the trim intent** — a blind append re-inflates the suite past 125. Full pre-trim backup + the list of removed cases live off-repo at `~/ols-qa-testing-bot/out/uat-trim-2026-07-24/`. |
| Sync (Lot1) | 🛑 **RETIRED — do NOT run `regression_sync.py` against the Lot1 tab.** The `OLS: TC List (Lot1)` tab is now **human-curated** (125 cases, customer-readable names, no `OLS-<n> TC_<n>:` prefix). `regression_sync.py` dedups by that prefix → it now matches **0** existing rows and would blind-append all ~400 candidates, re-inflating past the trimmed 125 (only the coercion guard on a `-` cell currently stops it). Point-fix applied 2026-08-05: `TGT_TAB` corrected to the renamed tab + `canon()` `<LEGACY_SSO_NAME>`→NDLP wired in, but the dedup/curation mismatch is a product decision — revive only after re-curating. Live regression sync = **Lot2** (`lot2_regression_auto.py`, hourly, runs clean). Auto-schedule disabled 2026-07-23. Details: [regression-tc-sync.md](https://github.com/Thitic9203/ols-qa-evidence/blob/main/docs/regression-tc-sync.md) |

## Bug-status sync — `Bug report by HI` tab (hourly, added 2026-08-16)

The customer's cross-system bug log lives in a **separate tab of the same customer UAT file**:
`Bug report by HI` (gid `1824188502`, 13 columns) — one row per bug across ELMS · CBMS · EvMS ·
**OLS**. An hourly job mirrors each OLS bug's Jira reality into it so HI-QA reads a current board
without asking. Tool is off-repo: `~/ols-qa-testing-bot/bugsheet_status_sync.py`
(job `com.thitichaya.ols-bugsheet-sync`, registered in SFD as `periodic`/3600s).

| Field | Value |
|-------|-------|
| Columns | `A No.` · `B System` · `C Bug on NH board` · `D Bug on SKL board` · `E Topic` · `F Priority` · `G Reporter` · `H Image/VDO` · **`I Bug status`** · `J Priority for Dev` · `K SKL-Dev PICK` · `L SKL-QA Comment` · `M Remark` |
| Write scope | **col I only, on `System = OLS` rows only.** Jira key is read from `D` (must match `^OLS-\d+$`). Every other column and every ELMS/CBMS/EvMS row is out of scope — enforced, not merely intended. |
| Decision table | 🔴 **Jira status `Done` → the row is LEFT ALONE** — checked first, and it now *stops* the decision instead of steering it (owner 2026-08-27, see below) · else **Sprint field (`customfield_10008`) empty → `Awaiting SKL-PO Confirmation`** (a bug still on the board with no sprint has not been planned into a dev sprint, so it is waiting on the PO — this check sits right after Done and ahead of the assignee/status rules, so a no-sprint bug routes to the PO regardless of who holds it; added 2026-08-24 per owner) · else assignee = `<SKL_PO_ACCOUNT_ID>` → `Awaiting SKL-PO Confirmation` · else Jira status `READY TO TEST`/`TESTING` → **`RECHECK BY SKL-QA`** · else → `FIXING BY SKL-DEV`. **Done must stay the FIRST test even though it produces nothing**: below the PO or assignee rules, a shipped bug held by the PO would read "awaiting PO", and below the status rules it would read `FIXING BY SKL-DEV` — both false. `classify()` returns `None` for it, and `plan_change()` turns `None` into a skip with a reason in the log. |
| Matched by | **accountId, never display name** (PM-005 — a name goes stale, an accountId does not). Real id → `~/.ols-qa-secrets/` § Bug-status sheet sync. |
| Allowed values (what the bot may WRITE) | `Awaiting SKL-PO Confirmation` · `FIXING BY SKL-DEV` · `RECHECK BY SKL-QA` — three, not four. 🔴 **`READY TO TEST` was removed from `ALLOWED_VALUES` on 2026-08-27**, so the L5 value lock refuses it even if some future branch computes it: the bot cannot produce the word at all. (`RECHECK BY SKL-QA` had joined the set on 2026-08-24; it was already in the replaceable set, so only what the bot may write changed.) |
| Never overwritten | 🔴 **Allow-list, not deny-list** (corrected 2026-08-20). The bot replaces only blank plus its own in-flight vocabulary — `OPEN` · `RECHECK BY SKL-QA` · `FIXING BY SKL-DEV` · `Awaiting SKL-PO Confirmation`. **Every other value is a human's deliberate word and is left alone**, with `unrecognised human value … — left untouched` in the run log. `PASSED` · `CANCELLED` · `IMPROVEMENT` · 🔴 **`READY TO TEST` (joined them 2026-08-27)** keep their own explicit "protected verdict" message. The code used to do the opposite — overwrite anything that was not one of those three — which silently loses each new word the humans invent: by 2026-08-20 HI-QA were already using `COMMENT FROM HI` and `FAILED AFTER RETEST` here, and only L3 (OLS rows only) kept them from being clobbered. Pinned by `tests/test_bugsheet_replaceable_allowlist.py`. |
| Skipped + reported | OLS rows whose `D` is blank cannot be matched to Jira; they are listed in the run log every time, never guessed at. |

### 🔴 RETIRED 2026-08-27 — the automatic hand-back, and the bot ever writing `READY TO TEST`

Owner instruction: **ยกเลิก flow ที่ปรับสถานะ RTT ในชีทบัคและ ticket ฝั่งลูกค้า — คนทำเอง ไม่ใช่ AI.**
Two behaviours were removed together, because they were the same decision made twice:

1. **Writing `READY TO TEST` into col I** when the OLS bug reached Done.
2. **Transitioning the twin `NH-xx` on the customer's own Jira** into `READY TO TEST` (added
   2026-08-21, six-layer gate N1–N5 + N2b). All of it is gone: no NH host constant, no credential
   read, no transition call, no `--no-nh` flag. The credential **file itself is kept** (path in
   `~/.ols-qa-secrets/`) — the one-off `out/mica-migration/*.py` scripts still read it.

Handing a finished bug back to the customer is a person's call. What is left of that is enforced
mechanically, not remembered — four independent things, each enough on its own:

| | mechanism | what it stops |
|:--:|---|---|
| 1 | `V_RTT` **not** in `ALLOWED_VALUES` | L5 `gate_value()` refuses `READY TO TEST`, so no branch can ever write it |
| 2 | `V_RTT` **in** `PROTECTED_STATUSES` | a cell a person set to `READY TO TEST` is never overwritten — the bot cannot undo their hand-back either |
| 3 | `classify()` returns `None` for Done | the row is skipped, not re-labelled. Falling through would print `FIXING BY SKL-DEV` on a shipped bug |
| 4 | no NH code, host, or credential in the module | the customer's Jira is unreachable by accident; a `NEEDS A HUMAN` block reports rows needing attention instead |

**`NEEDS A HUMAN` is now the queue, and it has two categories** — both report-only, decided by
the pure `needs_a_human(current, jira_status)`:

| category | when | why it must be loud |
|---|---|---|
| **awaiting** | bug is `Done` but col I still holds one of the bot's in-flight words (blank · `OPEN` · `FIXING BY SKL-DEV` · `RECHECK BY SKL-QA` · `Awaiting SKL-PO Confirmation`) | the sheet is actively telling the customer dev is still on a bug that shipped, and **nothing automatic will correct it any more**. This is the work the retirement created; buried among ~79 `keep …` lines it is the same as not reported |
| **stale_rtt** | col I reads `READY TO TEST` but the bug is no longer `Done` | somebody handed it back and it re-opened. Withdrawing their word is exactly what this job stopped doing |

A Done bug already carrying a human verdict (`PASSED` · `CANCELLED` · `COMMENT FROM HI` …) is
settled and stays **silent** — an advisory that fires on settled rows is noise, and noise is how a
real advisory gets ignored. `t_reporting_and_writing_never_disagree` pins that the report and the
writer can never contradict each other: anything flagged is never also written.

🔴 **Live proof the protection was needed, caught the same hour (2026-08-27 ~10:49).** Between two
runs a person wrote `READY TO TEST` into col I for **OLS-549** (twin `NH-464` — the fight-loop pair
below) while its Jira status was `TESTING`, not Done. **The old code would have computed
`RECHECK BY SKL-QA` and overwritten them within the hour.** The new run logged
`protected verdict 'READY TO TEST'`, wrote nothing, and listed the row under `NEEDS A HUMAN`.

**Live state on the day of the change** (dry-run, read-only): 79 eligible OLS rows — **44 Done**
(39 `PASSED` · 2 `READY TO TEST` · 1 `CANCELLED` · 1 `COMMENT FROM HI` · 1 `FAILED AFTER RETEST`)
now skipped, **35 non-Done** all already correct, **0 changes**, `NEEDS A HUMAN` empty. Every one
of the 44 already held a word the old bot could not overwrite either, so **the sheet outcome that
day was identical** — the only behaviour that actually stopped was the NH transition.

Tests: `tests/test_bugsheet_status_sync.py` (70 cases) + `tests/test_bugsheet_replaceable_allowlist.py`
(23 cases). The 34 NH tests went with the code; the section **"READY TO TEST is a human's word"**
replaced them and pins the *absence* — including `t_the_nh_write_machinery_is_gone_not_merely_unused`
(no such symbol may exist) and `t_no_customer_host_or_credential_anywhere_in_the_source` — that
one asserts the customer's Jira hostname, their credential filename and `/transitions` never
appear in the module (the literals live in the off-repo test, never here). Deleted code proves
nothing on its own; the next person to touch the decision table would not know it was deliberate.

#### 🔴 Why the hand-back is a person's job — บทเรียน 2026-08-24 (fight loop) ที่ยังต้องจำ

`NH-464` ↔ `OLS-549`: คน SKL กด OLS-549 เป็น `Done` เวลา 13:24 (แล้วถอยกลับ `To Do` ตอน 15:18) ระหว่างนั้น
HI-QA ย้าย NH-464 ออกจาก `READY TO TEST` กลับ `To Do` เวลา 14:21:48 — **บอทดันกลับเป็น `READY TO TEST` ตอน
14:22:03 คือ 15 วินาทีหลังคนย้าย** แล้วดันซ้ำอีกครั้งตอน 15:14:59.

- **สาเหตุที่ 1 — hand-back ไม่ใช่ one-shot.** คำนวณใหม่ทุกชั่วโมงจากสถานะปัจจุบัน จึงได้คำตอบเดิมทุกรอบ การยืนยัน
  คำตอบที่คนแย้งไปแล้วซ้ำๆ ไม่ใช่การ sync แต่เป็นการแย่งกัน · ตอนนั้นปิดด้วยเกต **N2b** (อ่าน changelog สองฝั่ง)
- **สาเหตุที่ 2 — ไม่มี reconciliation ขากลับ.** พอ OLS ถูกถอยออกจาก `Done` NH ยังค้าง `READY TO TEST` ต่อ เพราะ
  job ไม่ลากบอร์ดลูกค้าถอยหลัง → รายงานเป็นบล็อก `NEEDS A HUMAN` ให้คนไปเคลียร์
- **สาเหตุที่ 3 (คนละเรื่อง) — run crash หลังเขียนเสร็จ.** `ValueError: too many values to unpack (expected 6,
  got 7)` ที่ลูป L7: เพิ่มช่องใน tuple `plan` แล้วลืม consumer → เขียนชีทสำเร็จแล้ว crash = DM ทุกชั่วโมงทั้งที่งานผ่าน
  · pin ด้วย `tests/test_tuple_arity.py`
- **บทสรุปที่นำมาสู่การยกเลิก (2026-08-27):** N2b แก้อาการ "ยิงซ้ำ" ได้ แต่ไม่ได้แก้เหตุ — เหตุคือ **บอทกำลังตัดสินใจ
  แทนคน** ในเรื่องที่คนสองฝั่งต้องตกลงกัน. ตอนนี้เหตุถูกถอดออก และเหตุผลเดียวกันคือที่มาของกฎ `READY TO TEST` =
  protected: บอทที่ลบคำที่คนเพิ่งเขียน คือ fight loop ใบเดิม แค่สลับฝั่ง

### 🔴 Seven-layer write gate (each layer alone stops a bad write; all fail closed)

| ชั้น | ตรวจ | ผ่าน = |
|:--:|:--|:--|
| **1** file + tab | `spreadsheetId` ตรงค่าคงที่ · tab title **และ** gid ยืนยันสดทั้งคู่ · deny-list gid Lot1/Lot2 + 6 ไฟล์ frozen | ชี้ถูกไฟล์ถูกแท็บเท่านั้น |
| **2** header | row 1 ต้องตรง pinned header 13 ช่อง **เป๊ะ** · index ของ `Bug status` resolve จาก header ทุกรอบ ห้าม hardcode | คอลัมน์เลื่อน = abort ไม่ใช่เขียนผิดช่อง |
| **3** row eligibility | `B == "OLS"` **และ** `D` แมตช์ `^OLS-\d+$` **และ** Jira ตอบคีย์นั้นกลับมาจริง | ครบ 3 ถึงแตะ · แถวระบบอื่นไม่เข้าแม้แต่ใน log |
| **4** payload shape | ทุก range ต้อง `'Bug report by HI'!I<row>` เซลล์เดียว · row ∈ เซ็ตชั้น 3 · เกินเพดาน = abort — **เพดานปริยาย = จำนวนแถว eligible ของรอบนั้น ไม่ใช่เลขตายตัว** (เลขตายตัวจะกลายเป็นตัวล็อกงานตอนบั๊กโตขึ้น) · `--max-changes N` ทับได้ | range กว้าง/ทั้งแถว เขียนไม่ได้ทางกลไก · งานโตแล้วไม่ตาย |
| **5** value | ค่า ∈ 3 สตริงที่อนุญาต (**ไม่มี `READY TO TEST`** — ถอดออก 2026-08-27) · ข้าม verdict ของคน รวม `READY TO TEST` · `target = None` (บั๊ก Done) = ข้าม ไม่ใช่เขียนค่าว่าง · ค่าตรงอยู่แล้ว = ไม่เขียน | ค่ามั่วเขียนไม่ได้ · งานคนไม่ถูกลบ · บอทพูดคำว่า RTT ไม่ได้เลย |
| **6** whole-tab diff | อ่าน baseline **ใหม่ทันทีก่อนเขียน** (ไม่ใช้ของต้นรอบ — ระหว่างนั้นมี Jira call คั่น) + อ่านซ้ำหลังเขียน · snapshot ทั้งคู่ตั้งชื่อด้วย run stamp เก็บ 20 รอบล่าสุด · **ในคอลัมน์ที่เราเขียนได้** เซ็ตที่เปลี่ยนต้องเท่ากับที่ตั้งใจเป๊ะ (เกิน = fatal, หาย = fatal) · คอลัมน์อื่นชั้น 4 เขียนไม่ได้อยู่แล้ว → รายงานว่า "คนอื่นแก้ระหว่างรอบ" ไม่ใช่ fail | เกิน/หาย 1 ช่อง = หยุด + alert · คนพิมพ์ col L/M พร้อมกันไม่ทำให้ alarm ผิด |
| **7** read-back | อ่านกลับทีละเซลล์เทียบค่าที่ตั้งใจ · mismatch/exception = exit≠0 → SFD DM · **dry-run เป็น default** ต้อง `--write` | เฟลเงียบไม่ได้ |

**ช่วง `A1:M` เอามาจาก `rowCount` สดของแท็บทุกรอบ ห้าม hardcode** — เพดานตายตัวจะซ่อนแถวที่เกินไปเงียบๆ (ไม่โผล่ทั้งใน eligible และ skipped และ diff ก็เทียบ grid ที่ตัดเท่ากันสองอัน = ไม่มีสัญญาณเลย).

**plist ต้องชี้ `StandardErrorPath` ไปไฟล์เดียวกับ `StandardOutPath`** — `run_workflow.sh` ส่ง log ไฟล์เดียวให้ `fail_notify.py` ไปตัด tail; ถ้าแยก stream ไว้ โนติจะบอกแค่ `rc=3` โดยไม่มีเหตุผล เพราะทั้ง gate refusal และ traceback ออกทาง stderr หมด (ยืนยันจริงด้วย probe plist: สอง stream ลงไฟล์เดียวกันได้).

Tests: `~/ols-qa-testing-bot/tests/test_bugsheet_status_sync.py` (70 cases) — the decision table,
all seven sheet layers, the plist's stream routing, and the section pinning that the RTT/NH
behaviour is really gone — plus `tests/test_bugsheet_replaceable_allowlist.py` (23 cases). Run
both green before touching the script; a layer that stops refusing is a test failure, which is
the point.

## Bug mirror — the `list` tab of our own regression sheet (`bugmirror_sync.py`)

Our slice of the customer's `Bug report by HI` (System = OLS) copied into a sheet of ours,
`<BUGMIRROR_SHEET_ID>` tab **`list`** — columns dropped, one renamed, one added (the Jira issue
type), rows re-sorted by where each bug sits in its life. **The customer's file is only ever read.**
Columns **A:G are the mirror's and are rewritten from source on every run**; **columns I+ belong to
the reader and are never touched**, which is why rows are reconciled with whole-row moves keyed on
`Bug on NH board` rather than rewritten in place. Tool is off-repo; ids live in
`~/.ols-qa-secrets/`.

### 🔴 Spelling is corrected on the way through — never in the sheet, never in the customer's file

A typo in a mirrored `Topic` **cannot be fixed by editing the cell**: A:G is overwritten on the
next run, so a hand fix lives until the next sync and no longer. And the source is the customer's
file, which we must never write to. The only place a correction can hold is *in transit*, so
`bugmirror_sync.py` carries a `SPELLING` table and a `canon()` applied in `project()` — the single
funnel every mirrored column passes through.

- **Opt-out, not opt-in.** Every column is corrected by default; `NO_SPELL_TITLES`
  (`System` · `Bug on NH board` · `Ticket on OLS board` · `Ticket type on OLS board` ·
  `Bug status`) is exempt because those are identifiers the gates and the colour table match on.
  A prose column added later is covered without anyone remembering to ask.
- **Never silent.** Every run prints `N cell(s) spelling-corrected on the way through` and names
  each one. A mirror that quietly rewrites the customer's words would be worse than one that
  leaves the typo in.
- 🔴 **What may go in the table: only a spelling that is wrong in every context.** `Topic` quotes
  UI labels verbatim (`"ดูสื่อทั้งหมด"`, `"นำออกจากรายการบันทึกแล้ว"`); rewriting one would be the
  mirror inventing a spec. **A quoted label may only be corrected after the real screen has been
  read** — that is PM-006 applied to text: a word that *might* be a real product string is a
  question, not an entry.
- **Fix the ticket too when the slip is ours.** Correcting the mirror does not correct Jira: the
  mirror reads the customer's sheet, not our summary. Check `GET /rest/api/3/issue/<KEY>?fields=summary`
  and fix ours separately when it carries the same typo.
- Safe to change a string's length here: `_cell` keeps only `userEnteredValue` /
  `userEnteredFormat` / `dataValidation` and drops `textFormatRuns`, so no run is left pointing at
  the wrong character. The fingerprint is computed from the **payload**, not the source, so a
  correction lands once and then settles at `unchanged — nothing to write`.

**Entries as of 2026-08-25, each verified rather than assumed** (a row's own OLS summary is the
cross-check when it carries a key):

| wrong | right | where the truth was read |
|---|---|---|
| `อัพโหลด` (+ `อัพเดต`/`อัพเดท`/`อัพเกรด`) | `อัปโหลด` / `อัปเดต` / `อัปเกรด` | NH-462 — **OLS-535's own summary already spells it `อัปโหลด`**; the slip is the customer's transcription |
| `resposive` | `responsive` | NH-447 — OLS-511's summary spells it correctly |
| `Archievement` | `Achievement` | NH-483 — **ours**: OLS-578's summary carried it, next to a component tag spelling `Achievement` correctly. Jira fixed 2026-08-25 |
| `เนื่อหา` | `เนื้อหา` | NH-436 — a **quoted button label**, so it stayed out of the table until `<PREPROD_HOST>` was fetched signed-out and the live DOM read `<button …>เริ่มสร้างเนื้อหา</button>`, 0 occurrences of the misspelling. Both the customer's sheet and OLS-498 were wrong; OLS-498 fixed 2026-08-25 |

### Sort — and the holder ladder inside a group (reader's request, 2026-08-25)

Top to bottom: **PASSED → READY TO TEST → rows with a committed OLS-board sprint window (soonest
window first, by sprint START date) → active rows with no window.** CANCELLED has no bucket; those
rows leave the list entirely.

Inside a bucket: **Task before Bug**, then the **holder ladder**, then the source's own order. The
ladder is `HOLDER_ORDER` in the tool — one list, so the rungs cannot drift apart. **Every in-flight
status has a rung of its own**, which is the point: rows of one status are always contiguous
instead of being interleaved by whatever order the customer happened to type them in (owner,
2026-08-25).

| rung | status | why it sits there |
|:--:|---|---|
| 1 | `Awaiting SKL-PO Confirmation` | the PO — no fix window decided yet, somebody has to chase it |
| 2 | `FIXING BY SKL-DEV` | the dev — the work is still open |
| 3 | `RECHECK BY SKL-QA` | QA — the fix is in, only the verification is left |
| 4 | `FAILED AFTER RETEST` | the fix shipped and did not survive retest |
| 5 | `COMMENT FROM HI` | a question from HI is waiting on an answer |
| 6 | `IMPROVEMENT` | not a defect at all |
| 7 | `OPEN` | nobody has picked it up — **the owner placed it last**, 2026-08-25 |
| — | a status with no rung | below every rung, **grouped on its own text** — a word the customer invents next does not scatter either |

`OPEN` last is the owner's call, pinned by `open_sorts_below_every_other_named_status`. Rungs 4–6
order by how badly the row is stuck, which is a judgement, not something the customer stated. It is
cheap to change: reorder the list, nothing else.

The ladder is a **tiebreak and nothing more** — it applies only among rows that are otherwise
indistinguishable (same bucket, same ticket type, same sprint window). It never lifts a row over a
different type, an earlier window, or a better bucket; the tests
`awaiting_is_only_a_tiebreak_never_a_promotion` and
`fixing_before_recheck_is_only_a_tiebreak_never_a_promotion` pin each of those, and
`holder_ladder_is_spelled_as_the_customer_spells_it` pins every rung against the customer's
dropdown — a near-miss there would stop the rule firing silently instead of failing.

🔴 **`every_in_flight_status_has_a_rung` is the test that keeps this from decaying.** Every status
`STATUS_STYLE` paints, minus the ones with a bucket of their own (`PASSED`, `READY TO TEST`) and
the dropped ones (`CANCELLED`), must appear on the ladder. Without it the scatter returns the next
time the customer adds a word — which already happened once, with `RECHECK BY SKL-QA`.

**What the two 2026-08-25 changes actually moved.** Splitting `FIXING` from `RECHECK` moved **19
rows** — the 24/08–28/08 window now reads Awaiting → FIXING (Task then Bug) → RECHECK. Giving
rungs 4–7 their own places moved **nothing on the day**: the 77 mirrored rows carried only PASSED ·
READY TO TEST · Awaiting · FIXING · RECHECK, so the run went straight to `unchanged — nothing to
write` (the fingerprint is computed from the payload, so an identical payload is itself the proof
that no live row was affected).

**It legitimately increases how often the mirror rewrites.** A row whose status flips between two
rungs of the ladder now reorders *within* its bucket where before it did not move at all, and 21 of
77 rows currently hold `Awaiting SKL-PO Confirmation` against a writer every 5 minutes. That is the
feature working — not thrashing. Measured across the whole log after the change: **38 written vs
548 unchanged, longest consecutive-written streak 3**, and that streak is the initial seeding.

🔴 **`~n moved` right after a successful write is normally the customer editing their sheet, not a
convergence bug.** The counters this tool prints (Jira key counts, waiting-on-PO, untyped,
spelling) do not move when a status or an OLS key changes, so two consecutive runs can look like
identical input while the source has in fact changed underneath. Diff the source against a
`logs/bugsheet_sync_snap/*-after.json` snapshot before suspecting the sort. A real convergence bug
could not reach `unchanged since … — nothing to write`; this one does, and `plan_row_ops` only ever
moves rows **backwards** (`work.index(k, i)` searches forward from `i`, so `j ≥ i`), which is the
reading of Sheets' `destinationIndex` both interpretations agree on.

**Do not "fix" the missing start-date fallback.** `plans_by_nh` falls back to the mirror's cached
window when Jira is unavailable; `starts_by_nh` deliberately does not, because the cached window is
a display string with no year and cannot be sorted on. Such a row sorts after the dated ones rather
than being given an invented date, and the run says `WARN Jira unavailable` and exits 5. Guessing a
date to make the sort look tidier would be the mirror inventing data.

### `STATUS_ORDER` is a vocabulary, not a sort

`sort_key` never reads it (ranking is PASSED → READY TO TEST → has a fix window → in-flight); its
only use is the "unexpected status" note. It must name exactly what `STATUS_STYLE` paints, and the
test `status_vocabulary_agrees_with_the_palette` pins that. The two drifted once —
`RECHECK BY SKL-QA` was given a colour when the customer started using it and was never listed
here, so every healthy run printed an unexpected-status note about an expected status. **A note
that fires on healthy data is how a real one gets ignored.**

Tests: `~/ols-qa-testing-bot/tests/test_bugmirror_sync.py`. Green before shipping a change.

## HI bug-log watch — the two states nobody was watching (`hi_status_watch.py`, added 2026-09-03)

The customer keeps every bug for every system on one tab of their own file — `Bug report by HI`
in `<CUSTOMER_UAT_SHEET_ID>`. Two states on it are **our** work and were invisible from our side
until somebody scrolled the sheet. A read-only watcher now announces each one, once, in the
Discord thread `🚖 Support HI-QA for regression` (`<HI_QA_THREAD_ID>`), tagging the QA owner who
chases them.

| trigger (System = OLS only) | what it means | what the note asks for |
|---|---|---|
| `OPEN` **and** the "Bug on SKL board" cell holds no OLS key | HI-QA raised a bug and no ticket exists on our board, so it is in nobody's sprint — and the mirror correctly leaves its fix-plan cell blank, because there is nothing to schedule | go check it and open the ticket on the OLS board |
| `FAILED AFTER RETEST` | a fix shipped and did not survive retest | go check that NH ticket |

**Every fact in the message comes from the board that owns it, not from the sheet.** Summary,
`Priority` and `Reporter` are read live from the NH issue on `<NH_JIRA_HOST>`, and the key is
rendered as a link to it; the sheet is typed by hand and any of those three cells can be wrong.
A row whose NH ticket cannot be read is **not** announced with the sheet's values as a
substitute — the run refuses and fails loudly, because an alert carrying a wrong priority to the
person chasing it is worse than an alert that is late.

**The time is read out of the file's own version history, never guessed.** Sheets exposes no
per-cell edit time and Drive Activity is not granted here, so the watcher exports each revision
(`revisions.exportLinks`, xlsx, parsed with stdlib `zipfile`) and walks back from the newest only
while the status still holds — so a status the sheet reached, left and reached again reports the
**latest** arrival, not the first ever. 🔴 The answer is an **upper bound that coarsens the later
you ask**: Drive merges recent revisions as an editing session continues — proven 2026-09-03,
revision `11957` (1.14 PM) existed at 1.20 PM and by 1.37 PM had been merged into `11960`
(1.36 PM), moving the reported time by 22 minutes. So the value is **cached at first detection
and never re-read**, and the 30-minute schedule is what keeps it close.

**Gates, all fail-closed.** G1 file + tab identity + gid via `sheet_guard.verify_tab` (a rename
must not silently redirect it — PM-010) · G2 every column resolved from the header **by name**,
status through the `Bug status` / `Status` alias pair · G3 a status outside the customer's own
dropdown is reported, never silently dropped · G4 a message with no mention is refused, so an
alert can never post unowned · G5 the posted message is read back and its `channel_id` checked
before the run counts it as sent.

**One alert per episode, not per run.** State keyed on the NH key remembers which status was
announced; a row keeps quiet until its status changes, and a status that leaves and returns
alerts again. Findings are combined into one message (split only when Discord's 2,000-character
cap genuinely forces it). Dry-run is the default — `--send` posts.

**Schedule + SFD.** `com.thitichaya.ols-hi-status-watch`, `StartInterval 1800`, run through
`sfd/run_workflow.sh` (watchdog 1200 s < the interval, so runs cannot pile up), registered
`periodic` / `trap_wired: true` / `max_stale_s 21600`, and the plist points `StandardErrorPath`
at the same file as `StandardOutPath` — a gate refusal leaves by stderr, and split streams make
the DM fire with no reason attached.

**It writes to no spreadsheet at all** — the customer's file least of all. Its only side effect
is one Discord message per new finding.

## Responsive test matrix — the `Responsive` tab of the QA tracking sheet

Tracking grid for the **UI Responsive** work (epic `OLS-698`, story `OLS-325`
`[UI Responsive][Mobile, Tablet][All Page] ทุกหน้าของ Learner / Creator`). Built 2026-09-03.
Purpose is **two verdicts per screen, not one**: the layout must match the latest Figma, **and**
the system must still behave correctly once it does.

| Field | Value |
|---|---|
| Sheet · tab | `<QA_TRACKING_SHEET_ID>` → tab **`Responsive`** (gid `966725903`) |
| Shape | a real Google Sheets **Table**, `Responsive_Test_Matrix`, `A1:R409` — header row frozen, first 2 columns frozen |
| Rows | **408** = **204** unique Role × Screen × Route, each × **Tablet** and **Mobile**. One row is one platform — never both in one line — and `Test ID` plus `(Role, Screen, Route, Platform)` are both unique, asserted before the write |
| Columns | 18: `No. · Test ID · Role · Module · Page / Screen · Route · Jira Ref · Platform · Viewport (px) · Figma Ref · UI Responsive Status · UI Responsive Result · Functional Status · Functional Result · QA Owner · Linked Bug · VDO · Remark` |
| Roles | **6**, from `shared/constants/role.constant.ts` and the sidebar constants, not invented: Guest · Learner (ผู้เรียน) · Creator (ผู้สร้างสื่อ) · NDLP Creator · Admin Content (ผู้ดูแลเนื้อหา) · System Admin (ผู้ดูแลระบบ). The split earns its keep — `ADMIN_PATH_RESTRICTIONS` gates `/admin/user` to system admins, `visibleTo: isSystemAdmin` hides the achievement group from content admins, and `getCreatorSidebarSections` splices the moderation queue in for NDLP Creators only |
| Screen names | the app's **own** Thai labels wherever a sidebar defines one (`ความรู้ติดเทรนด์`, `จัดการเส้นทางการเรียน`, `ตั้งค่าช่องของฉัน`, …). A name QA invents is a name dev cannot look up |
| Dropdowns | `Role` · `Platform` · both status columns · `QA Owner`. Status vocabulary is the **live** one read off tab `OLS-654` of the same file — never a second list invented here |
| `QA Owner` list | the **4 people carrying the Discord role `ols-qa`** who appear in the `🚔 Target - OLS QA` thread — `QA Owner A`–`QA Owner D` (real names live only in `~/.ols-qa-secrets/`). Established by sweeping the thread's full history (501 messages, 8 distinct people) and then reading each one's guild roles, which is what separates QA from the product owner, the dev and the other team's QA who also post there. One participant is in the thread with no `ols-qa` role; the owner's call (2026-09-03) was to leave them out |
| Viewport | `Tablet 768 · 899→900 · 1024 · 1199→1200` · `Mobile 320 · 375 · 599→600` — from `apps/web/docs/responsive-manual-check.md`. **1199→1200 is not optional**: `md` (900) is where the *page* layout switches, `lg` (1200) is where the *chrome* does, so a 1024 tablet is still in hamburger-drawer mode |
| Every row carries its own proof | the `Remark` cell ends `หลักฐาน: <path>` naming the file in `ols-monorepo` that the screen is, and points at the per-page procedure in `apps/web/docs/responsive-manual-check.md`. Remark is the one wrapped column; the other 17 read on a single line |

### The eight gates the generator will not emit a row without

The first pass had 60 screens and was **wrong by omission** — it took the Jira subtask list as the
inventory. Subtasks name pages. They do not name the deep-linkable states, the flows, the empty and
error states, or the wizard steps, and a responsive defect lives in exactly those. Each gate below
exists because a real gap got through the ones before it:

| Gate | Refuses when |
|:--:|---|
| **1** evidence | a catalogue entry names a file that is not on disk — **174** evidence files |
| **2** route resolves | a route fails to match the app router's own tree (groups stripped, `@modal`/`(.)` intercepts folded onto their target URL) — **44** route patterns |
| **3** nothing uncovered | any product surface has no row: `page.tsx`, `not-found.tsx`, `error.tsx`, `global-error.tsx` — **48**, with **5** excluded and each reason stated |
| **4** unique | a duplicate `Test ID`, or a duplicate `(Role, Screen, Route, Platform)` |
| **5** state class | any `*-modal/-dialog/-sheet/-drawer/-tab/-step/-wizard.tsx` or any file whose name carries `empty·toast·skeleton·placeholder·loading·error` is neither used as evidence nor excluded — **112**, **23** excluded |
| **6** Jira | an `OLS-325` subtask has no row — **37/38**, the odd one stated below |
| **7** epics | an epic that owns Stories never appears as a `Module` — **16**, `OLS-698` excluded as the responsive epic itself |
| **8** global modals | a `ModalId` in `shared/providers/modal-provider.tsx` has no row — all **4** |

🔴 **Gate 5's regex is the one to watch.** It was written wrong twice — once the replacement never
applied, once an over-escaped `\\.tsx$` matched nothing — and both times the gate still printed
**ok** on a stale, narrower file set. A gate that passes while measuring less than it claims is worse
than no gate. Check the *count* it prints moved, not just that it said ok.

### What the page-only list was missing

| Missing | Real count |
|---|---|
| `/goals/[slug]` was one row | **6** real slugs, each with its own sidebar label |
| `/content` was one row | **11** deep-linkable `?tab=` values + the `grades`/`subGoals` filter state + the filter drawer + the sort sheet + the sub-tab strip |
| completion pages | `?review=1` rewords the button and summary for a revisit (OLS-543) |
| `/channel/[id]` | `?from=following` is its own entry, and a signed-in learner keeps the sidebar there while a guest does not |
| sign-in | there is no sign-in page: `?signIn=1` opens the NDLP drawer |
| social interaction | **the whole of `OLS-8` had no row** — the details/comments tab bar, the comment list and the comment box on content detail |
| readers | **6** distinct renderers — video, PDF, e-Pub, document, Office, rich text — whose heights the container README ramps per band |
| onboarding | a **3-step** wizard (หมวด → เป้าหมาย → ระดับชั้น), not one modal |
| reports | `/creator/reports` is **3** tabs |
| error surfaces | **6** `not-found` shells + 2 error boundaries + full-page loading/error + per-section error cards |
| empty states | **10** page-specific ones, plus 2 toasts |
| flows | ~60 modals, sheets and confirm dialogs that never change the URL — including the creator filter **bottom sheet**, which is a narrow-viewport surface a page-level list can never contain |

### Four routes that OLS-325 names or implies but that are not testable screens

| Route | What it really is |
|---|---|
| `/creator/profile` | **no such route.** `OLS-464` names it; the repo has `/creator/channel` + `/creator/settings`. This is the one subtask gate 6 allows to go unmapped |
| `/creator` | `redirect(ROUTES.CREATOR.CHANNEL)` — renders nothing |
| `/admin/master-data/goals` · `/reasons` | both `notFound()` — not implemented |
| "Onboarding Page" (`OLS-697`) | a **section on `/trending`**, not a page |

`/design-system` and `/debug/feed` are excluded as non-product screens — which is what
`containers/README.md` calls them too ("Internal tools, out of scope").

### 🔴 `Figma Ref` is filled for 162 of 408 rows, and the rest is blocked — not forgotten

The filled ones carry the artboard path **the monorepo itself records** in
`containers/README.md § Responsive support` (e.g. `page-features/pages/me/profile/responsive`) —
a table that also gives every route a retrofit badge (all 🟡: retrofit landed, viewport walk
outstanding) and the deliberate deviations from the mocks.

Per-screen Figma **frame links** cannot be produced right now, and the reason is not throttling:
the QA Figma token sits on a **Viewer/Collab seat**, whose Tier-1 allowance (`GET file`,
`GET file nodes`, `GET image`) is about **20 requests a month** and is exhausted. The response
headers say so directly — `x-figma-rate-limit-type: low`, `x-figma-plan-tier: pro`, and a
`Retry-After` that counts down 1:1 with the clock, refilling one request per ~37.8 h. `/v1/me` and
every Tier-2/3 endpoint answer 200 at the same instant, so the token is valid and this is a quota,
not an auth problem. Backing off cannot fix it. Two real options, both needing a decision:
a **Dev/Full seat** (org spend — needs approval per always-on rule 3), or reading the file through
the Chrome session, which takes over the user's screen.

Related: `ols-qa-e2e` `scripts/figma-check-nodes.mjs` issues **44** Tier-1 calls per run against
that ~20/month budget, so `npm run figma:check` can never finish and silently spends a month of it.
Its 429 handler advises "try later", which is the PM-010 lesson again — an alert must state the
consequence, not the status code.

## Test-type deliverable sheets — `sync-tc-result` (System / Integration / Unit)

Customer-facing deliverables (one spreadsheet per test type, **`- 03 OLS`** variant — CBMS/EvMS/ELMS
tabs are other systems, never touched). `sync-tc-result` routes every TC result from the QA source
sheet into these, split by **Type**. Real ids live in `~/.ols-qa-secrets/ §5.1`; tool is off-repo
(`~/ols-qa-testing-bot/tc_result_sync.py` + `sync_tc_config.json`).

| File | Placeholder | Tabs |
|------|-------------|------|
| System | `<SYS_SHEET_ID>` | 5 role tabs `TC00N ROLE - thai` (GUEST·LEARNER·CREATOR·CONTENT_ADMIN·SYSTEM_ADMIN) |
| Integration | `<INTEG_SHEET_ID>` | same 5 role tabs |
| Unit | `<UNIT_SHEET_ID>` | 12 function tabs `TC0NN …` + TOR (excludes the `…ตัวอย่าง` example tab) |

- **System/Integration header A–J** (row 1): Ticket(ลบก่อนส่ง) · ลำดับ · โมดูล · รายการทดสอบ · ขั้นตอน · ผลคาดหวัง · **G ผลการทดสอบ** · วันที่ · ผู้ทดสอบ · หมายเหตุ. Hidden key col K = `ticket|TCID`.
- **Unit header A–N** (row 1): No. · Sub Function · Test Scenario · Test Description · Pre-condition · Test Step · Test Data · Expected Result · **I Actual Result(รูป/TBC)** · **J Test status(dropdown: Passed/Failed/Blocked/N/A/Not Started)** · K Test Date(capture-file createdTime DD/MM/YYYY; ไม่มีรูป→TBC) · L Test By(QA owner first English name; ไม่มี→TBC) · M Comment · N hidden key `ticket|TCID`. Python owns A–H,J–N; Apps Script owns I only.
- **Status → col G (Sys/Integ):** PASSED / PWMI → `ผ่าน` · FAILED → `ไม่ผ่าน` · BLOCKED / SKIPPED / TESTING → `อยู่ระหว่างดำเนินการ` · NOT STARTED / blank → `รอการทดสอบ`.
- **Write model — Sys/Integ:** rebuild data rows each run + timestamp tested rows + **keep** the bottom QA summary-formula block + **repair** System `=COUNTIF(#REF!,"ไม่ผ่าน")` (mirror the passed-count G-range). Integration failed-count starts `G11`/`G15` not `G2` — a customer template quirk, left as-is (touching it needs user approval). 5-layer fail-closed gate per tab, restore-on-fail; snapshots under `~/ols-qa-testing-bot/logs/tc_result_sync_snap/`.
- **Write model — Unit:** keyed upsert by col N (`ticket|TCID`) so the CellImage in col I rides its row across rebuilds. Image embed done by a bound Apps Script (`docs/tc-result-img/Code.gs`; Drive consent obtained, hourly trigger active). PASSED+evidence → composite PNG in col I (multi-image: vertical stack, 460 px wide, 22 px gray gap, ≤1400 px tall, uploaded to `_composites/`). Non-passed → TBC text in col I.
- **Status:** delivered, then **RETIRED 2026-08-11**. Content was ALL 3 live (System 10/10 role tabs · Integration 10/10 · Unit 116 rows/9 tabs, 82 images embedded). 🛑 **The hourly job `com.thitichaya.ols-tc-result-sync` is no longer installed** — its plist was renamed `*.plist.frozen-2026-08-11` on the day the three `Lot 1 & 2 ALL` deliverables were frozen, because the job writes exactly those files. Do not reinstall it: that would put an automated writer back onto frozen customer deliverables. It was also removed from `sfd/workflows.json` on 2026-08-16 — a retired job left in the registry makes the heartbeat page `rc=unloaded` forever for something nobody intends to run, which is how a real alert gets trained into noise.
- **Hourly job hardened (2026-07-30):** two failure modes that had silently stalled the hourly run were fixed at root cause. (1) *unit `--rows-only` 400 every hour* — `write_rows` cleared a hardcoded `A2:H400`/`J2:N400` while the Unit tabs are 9–39 rows (some 13 cols), so `values:batchClear` rejected the out-of-grid range; fix = `_grid_plan()` grows the grid to fit the data + key col N, then clamps the clear tail to the grid. (2) *run hung 2.7 days and blocked every later run* — the openers called `urllib.urlopen` with no `timeout`, so a stalled socket blocked forever and launchd (no-overlap) never spawned the next run; fix = `timeout=120` + `URLError`/`TimeoutError` retry in every opener **plus** a per-leg 1200 s watchdog in `run_sync_tc_result.sh`. Verified by a clean full run (both legs rc=0, no data/image loss) + a 9-case grid-plan regression test.

## Screenshot evidence (Drive)

Per-ticket screenshot capture for QA evidence — one folder per ticket, **one subfolder per Test Case ID inside it**.

| Field | Value |
|-------|-------|
| Root folder | `Capture screen (OLS)` → https://drive.google.com/drive/folders/<EVIDENCE_DRIVE_ROOT_ID> |
| Per-ticket folder | `OLS-<key>` (e.g. `OLS-44`) — create it if missing before testing |
| **Per-Test-Case subfolder (บังคับ)** | inside `OLS-<key>`, create **one subfolder per Test Case ID** (e.g. `OLS-44/TC_01/`, `OLS-44/TC_02/`) and put that case's evidence there. Structure = `Capture screen (OLS)/OLS-<key>/<TC-ID>/<files>`. Create the subfolder if missing before uploading that case's evidence. |
| Naming | one screenshot per Expected Result inside its case subfolder, e.g. `OLS-44/TC_01/TC_01-ER_1.png`; whole-flow video `OLS-44/TC_01/<TCID>_<role>.mp4` — mirror `docs/result/OLS-<key>/` |
| Upload command | `drive_upload.py --parent <EVIDENCE_DRIVE_ROOT_ID> --ticket OLS-<key> --tc <TC-ID> <files…>` — **one call per test case**, `--tc` routes into `OLS-<key>/<TC-ID>/`. (Omitting `--tc` keeps the legacy flat behaviour — new runs must pass `--tc`.) |
| 🔐 **Write scope (บังคับ)** | อัปโหลดผ่าน `drive_upload.py` เท่านั้น — ด้วย `--tc` เขียนได้เฉพาะในโฟลเดอร์ `OLS-<key>/<TC-ID>` (scope lock ตรวจ 2 ชั้น: ticket folder ใต้ root + TC subfolder ใต้ ticket folder) · **ไฟล์ที่ QA อัปไว้ = ห้ามทับ ห้ามลบ ห้าม rename และห้ามเอาลิงก์มาอ้างเป็นหลักฐานของรอบ AI** · ชนชื่อ → เปลี่ยนชื่อไฟล์ของรอบเราแล้วอัปใหม่ |

## Bug ticket field schema (where the bug content actually lives)

**OLS Bug tickets keep their content in custom fields, NOT in the `description` field** (which is
empty on OLS bugs — verified OLS-75, OLS-227, 2026-07-18). Any retest/verdict logic MUST read these,
not `description`. All are ADF (`{"type":"doc",…}`) — parse the text out.

| Field ID | Meaning | Use in retest |
|----------|---------|---------------|
| `customfield_12116` | **Expected result** | the verdict source — compare the fixed behavior against this **character-by-character** where it specifies exact wording (WORKFLOW.md line 388). ALL items met = PASSED; any unmet = FAILED |
| `customfield_12113` | **Test step** | the steps to reproduce / re-verify the fix |
| `customfield_12112` | **Test data** | data/preconditions needed to reproduce |
| `customfield_12114` | **Actual result** | the original bug symptom (what to confirm is now gone) |
| `customfield_12115` | Actual result link | evidence link from the original report |
| `customfield_12111` | Root cause description | dev's root-cause note |
| `customfield_12110` | Root cause type | e.g. "Logic Error" |
| `customfield_12122` | Severity | e.g. High |
| `customfield_12118` | Web browser name | e.g. Google Chrome |
| `customfield_12125` | Detected on Environment | e.g. Dev |
| `customfield_12120` | **QA Owner** | Discord ping target (array; NEVER the Reporter — see below) |
| `customfield_12123` | Test Result Approval by QA | QA approval state |
| `customfield_12124` | Pair Testing Status | |

Read call (retest): `GET /rest/api/3/issue/<KEY>?fields=summary,status,issuetype,customfield_12116,customfield_12113,customfield_12112,customfield_12114,customfield_12111,customfield_12122,customfield_12118,customfield_12125,customfield_12120`. If `customfield_12116` is empty, fall back to any expected-result text in a comment/description; if still nothing → **BLOCKED** (cannot verdict without an expected result).

### Bug creation format (OLS) — get it right the FIRST time (บังคับ, กันต้องมาปรับซ้ำ)

When filing a new OLS Bug, produce it in this exact shape so it needs **zero** manual fix-ups afterward
(learned OLS-368, 2026-08-06 — the first draft had a run-on title with no prefix space and prose-blob
Actual/Expected, and every one had to be re-edited by hand).

- **Summary** = `[Component][Feature][Role] <concise description>` — bracket-tag prefix then **exactly ONE
  space** after the closing `]` before the Thai/description text (e.g. `[Archivement][Badge][ผู้ดูแลเนื้อหา] แก้ไข badge …`).
  Mirror the sibling bug's prefix tags verbatim. Keep the description **concise but complete** — enough to
  know the flow + symptom, no run-on sentence, drop details that already live in the fields (they duplicate).
- **Actual result (`customfield_12114`)** and **Expected result (`customfield_12116`)** = **bullet lists**
  (v2-wiki `* ` one point per line), **never** one long run-on paragraph. One fact per bullet.
- **Evidence image goes INSIDE the Actual-result field** — attach the screenshot to the issue first, then
  reference it inline with `!filename.png!` on its own line (one blank line above it, after the bullets).
  Verify rendered: bullets → `<ul><li>`, image → `<img src=…/attachment/content/…>` (not literal `!…!`).
- **Full field set + REST mechanics** (required fields, `customfield_12110` root-cause-type must be an
  **array**, sprint `customfield_10008` = numeric id, epic `parent` per the related story's epic, `labels`
  e.g. `need_fix`, `POST /rest/api/2/issue`): mirror an existing team bug (e.g. OLS-289/OLS-368) — see local
  agent memory `reference_ols-bug-create-rest-fields`. QA Owner (`customfield_12120`) NEVER the Reporter.

## Dev session relink command (login by command — verified 2026-11-10, post-mortem #0201)

Restores a dead dev session **without a password** (retest-bug Step 4b relink). Verified against the script itself: `session_relink_dev.js` refuses to run without the `OLS` env var (no default, `:266`) and renews exactly one roster tag per `--force`.

```bash
cd <QA_BOT_DIR> && for a in <TAG_1> <TAG_2>; do echo "=== $a"; OLS=https://<DEV_HOST> node capture/session_relink_dev.js --force "$a" >/tmp/relink-$a.log 2>&1 && echo "$a OK" || echo "$a FAILED (log: /tmp/relink-$a.log)"; done
```

Then prove it with `ROSTER=<QA_BOT_DIR>/capture/accounts_dev.json OLS=https://<DEV_HOST> node capture/session_verify.js <TAG>`. A relink that fails because the identity-provider cookies are long expired is not fixed by retrying: the account's cases are BLOCKED (session not restored). `curl` returning `000` against the dev host is a local certificate-trust result, not an outage — probe with `-k` before saying the host is unreachable.

## Retest-bug QA notify

After a retest-bug close-out (retest-bug-workflow Step 9), post a **retest-result FYI** to the QA Discord thread.

- Helper: `discord_qa_notify.py --mode retest --ticket OLS-<key> --title "<jira title>" --summary "Retest of dev fix" --pass-count N --fail-count N --blocked-count N --body $'• <bullet>' --result-link "<Jira retest-comment URL>?focusedCommentId=<id>" --qa-owner "<QA Owner name>" --owner-label "QA Owner"` — always `--dry-run` first, eyeball, then send.
- **Recipient = the ticket's QA Owner — Jira field `customfield_12120` — NEVER the Reporter** (user correction 2026-07-15 after 3 wrong pings). Read the field from the bug itself before every send; pass that exact name as `--qa-owner`. If `customfield_12120` is empty → ask the user, do not fall back to Reporter silently.
- **Transport (send it yourself — every OLS ticket tested by AI: retest, testing-ticket, any other round; owner 2026-10-30):** from `~/ols-qa-testing-bot`, `export OLS_DISCORD_WEBHOOK="$(tr -d '[:space:]' < ~/ols-qa-testing-bot/.discord_webhook)"` and `OLS_JIRA_CREDS` from `.jira_token` (same as `_retest_closeout.sh`), and always pass `--jira-key OLS-<key>` (re-reads the live QA Owner) and `--registry notify_registry.json`. Success = `OK: posted (HTTP 200/204); mention=<@id>; registered msg=<id>` in the QA thread. `SKIP: OLS_DISCORD_WEBHOOK empty` means the export was missing — the webhook file is not under `~/.ols-qa-secrets/` (OLS-279, 2026-10-30).
- Retest mode = single verdict headline + link to the Jira retest comment — **no** "pending review" wording, no Sheet tab (a retest bug is not tracked in the QA sheet).
- Thread, webhook location, name→Discord-ID roster, and the @mention + User-Agent rules: reuse [ai-assisted-testing-template.md](https://github.com/Thitic9203/ols-qa-evidence/blob/main/docs/ai-assisted-testing-template.md) Stage 6 and local agent memory `reference_ols-discord-qa-notify`. **Webhook URL is a secret — never commit it here.**

## TC review notify

Fixed destination for every **OLS** TC review (tc-review-workflow Step 5), whoever runs the skill — owner decision 2026-10-20. **OLS only** — other projects use their own group.

- Channel: `<TC_REVIEW_NOTIFY_CHANNEL>` in guild `<DISCORD_GUILD_ID>` — real ids in local secrets §6. **Never ask which group/channel**; `tools/ask-guard` blocks that question (state `fixed-destination`).
- Ask only: which thread of that channel. Post with the channel's webhook + `?wait=true&thread_id=<thread>`; read back `channel_id` = the thread id.
- Webhook URL: local secrets file `discord_webhook_tc_review_<thread>` (bound to `<TC_REVIEW_NOTIFY_CHANNEL>`; any thread of that channel works by changing `thread_id`). Never commit it.
- Mention = the ticket's QA Owner (sheet tab `QA Owner` column → Discord id roster), never a fixed id.

## TC glossary (terminology source of truth)

Thai wording used inside test case content. Rules: [tc-glossary.md](tc-glossary.md).

| Field | Value |
|-------|-------|
| Published sheet | https://docs.google.com/spreadsheets/d/e/<TC_GLOSSARY_PUB_ID>/pubhtml |
| Tab | `คำที่ใช้ใน TC` |
| `gid` | `1039533787` |
| CSV export | `https://docs.google.com/spreadsheets/d/e/<TC_GLOSSARY_PUB_ID>/pub?gid=1039533787&single=true&output=csv` |
| Local mirror | [`references/tc-glossary.csv`](https://github.com/Thitic9203/ols-qa-evidence/blob/main/references/tc-glossary.csv) — verbatim export; never hand-edit |
| Other tabs (not used for TC wording) | `EvMS` (gid 0) · `CBMS` (996233269) · `ELMS` (2836061) · `OLS` (1770700178) · `จำแนก TC` (221306802) |

Re-fetch and confirm with the user **before every TC design run** — see [tc-glossary.md](tc-glossary.md) § Re-check gate.

## Test Environment

> 🔴 **Intake gate — ก่อนเริ่มเทส/รีเทสทุกครั้ง ต้องยืนยัน env + account เสมอ (บังคับ):**
> 1. ก่อนแตะ Playwright/login ต้องรู้ **(ก) env ไหน** (dev / pre-prod / staging / prod) และ **(ข) account/role ไหน** ที่จะใช้.
> 2. **ยังไม่เคยระบุในเซสชันนี้** → ถาม user ครั้งเดียวรวม (env + account) แล้ว**รอคำตอบ** ห้าม default/เลือกเอง (แม้ env นึงจะเข้าง่ายกว่า ก็ห้ามเลือกเอง — เป็นสิทธิ์ user · หมายเหตุ: dev/pre-prod **ต้อง VPN** · training **ไม่ต้อง VPN**).
> 3. **เคยระบุแล้ว** (ใน session นี้ หรือ user เพิ่งบอก) → **อย่าถามซ้ำ** ให้ **แจ้งในแชท**ว่าจะใช้ค่าอะไร (`เทส env=<X> · account=<role/ชื่อ>`) แล้วให้ user **confirm สั้นๆ พอ** ("ใช้ตามนี้นะ ถ้าจะเปลี่ยนบอกได้") — ไม่ต้องให้ user ตอบใหม่ทั้งหมด.
> 4. หลังยืนยัน env → รัน **pre-flight login smoke gate** (ด้านล่าง) เฉพาะ role ที่รอบนั้นใช้จริง ก่อนเริ่มเทส.

| Env | URL |
|-----|-----|
| Dev | `https://<DEV_HOST>/` — **VPN required** · auth via NDLP68 SSO |
| Pre-prod | `https://<PREPROD_HOST>/` — **VPN required** (corrected 2026-08-08 per user; earlier note said no-VPN) · same NDLP68 SSO iframe (`<SSO_PORTAL_HOST>/sign-in/embed`) · verified working 2026-07-23 with the 5 dev pool accounts (local agent memory `reference_ols-test-accounts` has the cross-env role table) — **one account's role did not carry over** (Region Admin dev account → plain Learner on pre-prod), confirm before assuming dev role = pre-prod role |
| SuperApp (EduPass, Android) | `<EDUPASS_UAT_APK>` (label `Edu Pass uat`) on Android Studio emulators — **needs VPN** (user, 2026-11-06). The in-app OLS WebView loads the **Dev** host even though the APK is labelled UAT (measured 2026-11-06). Two device kinds (measured 2026-11-09): a `google_apis` image (`ro.debuggable=1`, WebView reachable by DevTools) and a Play Store image (`ro.debuggable=0`, not reachable: tap by OCR, DOM checks BLOCKED). Login is done by the person on the device; the agent never types a password. After a system Back the mini-app closes and is reopened from the SuperApp home (the tile that opens it: ask the person once, then record it here). Evidence goes to the destination named at intake. Branch reference: `android-superapp-branch.md` under the testing-ticket-workflow references. Test account: `<TEST_ACCOUNT_SUPERAPP_CREATOR>` (real value in local secrets). |
| Staging | *(not configured — ask user and update this table)* |
| Production | *(not configured — ask user and update this table)* |

### Account pool (counts only, for parallel lanes)

Source: tab `Account_Test` of the `Test Cases - OLS QA` sheet, read 2026-10-07. Emails and passwords stay in that sheet and in local agent memory — **never in this repo**. One account = one lane (`references/parallel-test-lanes.md` §3), so the count per role is the lane ceiling for that role.

| Env | NDLP68 user → OLS role | Unique accounts |
|-----|------------------------|:---------------:|
| Dev / Pre-prod | Central Admin → User Admin | 1 |
| Dev / Pre-prod | School Admin → Content Admin | 4 (one notes its highest NDLP role is system admin) |
| Dev / Pre-prod | Teacher → Learner, Creator | 3 (the sheet lists 4 rows; one account is listed twice) |
| Dev / Pre-prod | Student → Learner, Creator | 4 |
| Dev / Pre-prod | OBEC Admin, Region Admin | **0**: none listed for this env |
| obectraining69 | OBEC Admin → System Admin | 2 |
| obectraining69 | Region Admin / PEO → Content Admin | 3 (2 Region, 1 PEO) |
| obectraining69 | School Admin → Content Admin | 1 (plus 1 Teacher-labelled account provisioned as Content Admin) |
| obectraining69 | Teacher → Learner, Creator | 1 |
| obectraining69 | Student → Learner, Creator | 2 |
| Production | one per role (OBEC, Region, School Admin, Teacher, Student) | 1 each; smoke only, never parallel |
| ndlp68-test | (listed) | **env disabled**; do not use |

Learner (general public) and Guest need no account. The sheet labels accounts "Dev / Pre-prod", but the Pre-prod row above records one account whose role did not carry over: confirm the role per env in the pre-flight login before leasing.

**Per-account limits (measured on Dev, 2026-10-08, Teacher account, Chrome):**
- **OTP: none.** A username and password sign straight in through the NDLP68 SSO drawer, with no one-time code. That means there is no shared OTP inbox to coordinate between lanes. The other roles use the same SSO, but they were not each tried.
- **Rate limit: 600 requests per user per 60 s window.** The OLS API returns `x-ratelimit-limit-user: 600`, `x-ratelimit-remaining-user` and `x-ratelimit-reset-user` (≤ 60 s). The limit is counted per user, so lanes on different accounts do not share it.
- **Not single-session (measured 2026-10-08).** The same Teacher account was signed in from two isolated browsers at once, the main Chrome profile and a separate-profile Chrome. Both kept answering `200` on `/api/me/achievements`, so a new sign-in does not end the older session. The lane lease still applies (one account per lane), because two lanes on one account would still share data and the per-user rate limit.
- **Second sign-in for checks:** `node tools/iso-login/iso-login.mjs <username> https://<DEV_HOST>/?signIn=1` opens a separate-profile Chrome at the sign-in drawer with the username already filled and the cursor in the password field. The person types only the password. `node tools/iso-login/wait-logged-in.mjs` waits until that window is signed in.
- Some accounts are `yopmail.com` addresses, which are public inboxes. That matters only if OTP or email flows are added later.
- **Session lease (lanes, owner 2026-10-13):** the lease tool is `node ~/ols-qa-testing-bot/capture/session_lease.js` — `acquire <account tag> --ttl-min <N> --holder "<lane id> <round id>"` before a lane loads that account's saved login file, `renew <account tag> --ttl-min <N>` on long runs, `release <account tag> --holder "<lane id> <round id>"` in `finally` (only the holder that owns a lease can release it), `list` to see what is held. `acquire` is refused while another holder's lease is fresh — use another account or wait; only the main thread may clear a dead holder's lease with `release <account tag> --force`. Lease files live in `~/ols-qa-testing-bot/capture/leases/` (gitignored, no email or password); the dev relink skips any tag with a fresh lease. Merge check: `node tools/lane-lease-check/check.js --round <round id> --dir ~/ols-qa-testing-bot/capture/leases` (exit 0 required).

### Auth / login flow

> **🛑 Pre-flight login smoke gate — ก่อนเริ่มเทส/รีเทสทุกครั้ง (บังคับ, user 2026-07-21; scope แก้ 2026-08-02).**
> ก่อนเริ่มเทสสตอรี่/รีเทส **ทุกครั้ง** ต้องลอง **headless login เฉพาะ role ที่รอบนั้นจะใช้จริง** ก่อน (ดูจากเทสเคสในรอบว่าแตะ role ไหนบ้าง — **ไม่ต้องลองครบทั้ง 5 role**; รอบไหนใช้หลาย role ก็ login ครบเฉพาะ role เหล่านั้น) → ทำตารางผลต่อ role (✅/❌ + reason) แจ้ง user. role ที่จะใช้ผ่านครบ → เริ่มเทสได้; role ที่จะใช้ล้ม → หยุด + รายงาน + รอ user (หรือ user สั่งข้าม role นั้น). เครื่องมือ: `capture/preflight_roles.js --plan <KEY>_evidence_plan.json --env <env>` (ชุด QA bot, off-repo) — ล็อกอินครบทุก role ที่แผนหลักฐานต้องใช้ แล้วบอกว่า role ไหนใช้ได้จริง · **บังคับใส่ `--env` ไม่มี default** (เลือก env เป็นสิทธิ์ของ user ตามกฎด้านบน) · ไม่เชื่อ label ในชีตบัญชี — เทียบกับ role จริงที่ auth API ตอบกลับ แล้วแจ้ง MISMATCH (ดักเคสบัญชีชื่อ learner ที่จริงเป็น CREATOR บน pre-prod). ดัก auth-backend ล้ม(เช่น NDLP68 `400` — [[ols-ndlp68-login-backend-400]]) ตั้งแต่ต้น. ขั้นตอนเต็ม → template [ai-assisted-testing-template.md](https://github.com/Thitic9203/ols-qa-evidence/blob/main/docs/ai-assisted-testing-template.md) §2.3.4; สำหรับ unattended bot = mark role ที่ล้มเป็น Blocked ไม่ halt.

OLS ไม่มีหน้า login ของตัวเอง — login ผ่าน **NDLP68 portal** (`https://<SSO_PORTAL_HOST>`) แล้ว SSO session carry เข้า OLS อัตโนมัติ. NDLP68 เซ็ต auth cookie บน parent domain `<COOKIE_DOMAIN>` → cookie ส่งถึง `<DEV_HOST>` เอง (login ndlp68 สำเร็จ → refresh dev-ols = login แล้ว). Login API: `POST {backend}/auth/login-with-email`, cookie session (`withCredentials`); backend = `school-core-api-{env}<COOKIE_DOMAIN>` (env ∈ dev/uat/preprod/ndlp68/prod).

- **Full step-by-step runbook + NDLP→OLS role mapping:** [ols-login-runbook.md](https://github.com/Thitic9203/ols-qa-evidence/blob/main/docs/ols-login-runbook.md) — AI ตามไฟล์นี้เพื่อ login ทดสอบระบบได้เลย
- **Account**: staging accounts มี 5 roles (Student / Teacher / School Admin / Admin OBEC / Region Admin) — email + password **ไม่ commit ลง repo (public)** → เก็บใน agent memory (local) หรือขอจาก user. Teacher = role หลักของ creator/media QA. Role mapping → OLS: Student=Learner · Teacher=NDLP Creator · School Admin=Admin Content · Admin OBEC=Admin User · Region Admin=TBD.
- **Automated login (verified working):** ใช้ headless `use_browser` (skill `superpowers-chrome:browsing`) — invisible, ไม่แตะจอ user. Flow: accept PDPA overlay ("ยอมรับ") → เปิด login modal (`#email` / `#password`) → submit. **reCAPTCHA v3 ผ่านแบบ headless ได้ ไม่โดน block.** Full runbook + selectors อยู่ใน agent memory `reference_ols-ndlp68-auto-login`. (แก้ note เดิม: automation ไม่ได้โดน classifier block — login มือเป็น fallback สุดท้ายเท่านั้น)
- Verify creator mode: sidebar มี "จัดการสื่อการเรียนรู้" + ปุ่มล่างเขียน "เปลี่ยนเป็น Learner mode" (dev-ols เปิดมาเป็น Learner view ก่อน, `localStorage.isCreator=false` → กด toggle เป็น Creator mode)
- **Detailed runbook** (tooling workarounds, สร้าง test data, status transitions): `docs/result/OLS-44/ols-44-creator-media-editing-testing.md` § Setup & Runbook

## OLS domain — LP states & test-data recipes (learned OLS-26, 2026-07-13)

**Learning Path (LP = "เส้นทางการเรียนรู้") status model** (from app bundle `LearningPathStatus`): `Draft (แบบร่าง) · Published (เผยแพร่) · PendingEdit (รอแก้ไข) · Unpublished (ยกเลิกการเผยแพร่) · Flagged (ถูกรายงาน)` + delete = **recoverable soft-delete** → view shows "เนื้อหานี้ถูกลบแล้ว".
- ⚠️ **"ไม่อนุมัติ / rejected" is NOT a normal LP status** — it belongs to the **media** community-approval vote flow (OLS-86), not LP. An LP TC asking for "ไม่อนุมัติ" is likely a spec copy-paste from the media flow → confirm with PO before testing (M2).
- **Status-specific LP views require an authenticated learner** — a pure guest gets 404/loading for non-published LPs.
- **Progress is tracked GLOBAL per media, not per enrollment** (`PUT /api/media/{id}/progress`; enrollment object is just `{"enrolled":true}`). Courses are shared across LPs → completing a course in one LP also completes it in every LP that reuses it. ⚠️ กระทบการเตรียม fixture: dev มี LP ที่ enroll ได้จริงจำกัด (ช่วง OLS-26 มีตัวเดียว "นักบวช") — ทำ state "เรียนจบ" จะทับ fixture "กำลังเรียน" ของเคสอื่น · แก้: Creator สร้าง LP+คอร์สใหม่แยกเป็น fixture.
- **Non-owner direct-URL view of a non-published LP → generic error "ไม่สามารถโหลดข้อมูลได้" (API 403/404), NOT a state-specific message** (learned OLS-26 TC_16/17/18). ข้อความเฉพาะสถานะ ("เนื้อหานี้ไม่พร้อมใช้งาน"/"ถูกลบแล้ว"/"อยู่ระหว่างการแก้ไข") อาจตั้งใจให้ขึ้นเฉพาะ surface "การเรียนของฉัน" ของ learner ที่ enroll ไว้ — ยืนยันกับ PO.
- **Delete = recoverable soft-delete** (API) แต่ **UI dialog เตือน "ไม่สามารถย้อนกลับได้"** (ขัดกัน) และไม่มีปุ่มกู้คืนใน creator UI → ยืนยันกับ dev ว่าอันไหน authoritative · toast สำเร็จ = "ลบเส้นทางการเรียนรู้เรียบร้อยแล้ว".
- **Known bug (OLS-26):** ปุ่ม **"บันทึก" (bookmark)** บนหน้า LP/course กดแล้วไม่ทำงาน — ไม่มี network request / state change / console error (ขณะ enroll ทำงานปกติ). LP ใน "การบันทึกของฉัน" เดิมเป็น placeholder id (`learning-path-1/2/3`) เปิดแล้ว error.

### Media object — `status` vs `reviewStatus` are TWO different fields (learned OBEC-training69 smoke, 2026-08-09)

`GET /api/media/{id}` carries **two** state fields — reading the wrong one for a lifecycle precondition check silently gives a stale value:

- **`status`** = the real **lifecycle** state: `DRAFT` (แบบร่าง) · `PUBLISHED` (เผยแพร่) · `UNPUBLISHED` (ยกเลิกการเผยแพร่) · `PENDING_EDIT` (รอแก้ไข). **This is the authoritative state for any publish/unpublish/edit precondition or transition assertion.**
- **`reviewStatus`** = the **moderation** outcome only: `PENDING_APPROVAL` → `APPROVED`. Once approved it **freezes at `APPROVED`** and does **not** track later lifecycle moves — so a media sitting in `PENDING_EDIT` still reads `reviewStatus=APPROVED`.
- 🔴 **Precondition/verdict logic MUST key off `status`, never `reviewStatus`.** A checker that reads `reviewStatus` first sees stale "APPROVED" on every already-approved media and will falsely BLOCK/PASS. (This caused a whole media-lifecycle batch to false-BLOCK on the first run before being root-caused.)
- **Transition wording verified (char-exact, training69):** unpublish → confirm dialog "ยืนยันการยกเลิกการเผยแพร่ ผู้เรียนจะไม่สามารถเข้าถึงเนื้อหานี้ได้…" → toast **"ยกเลิกการเผยแพร่สำเร็จ"** (PUBLISHED→UNPUBLISHED); republish of an already-approved media fires `POST …/republish` **immediately with no confirm dialog**, toast **"เผยแพร่สื่อเรียบร้อยแล้ว"**, goes straight to PUBLISHED (does **not** re-route through รออนุมัติ/PENDING_APPROVAL); edit → dialog "ยืนยันการแก้ไข" ("การแก้ไข มีผลกระทบต่อผู้เรียน…") → toast **"เปลี่ยนสถานะเป็นรอแก้ไขสำเร็จ"** → PENDING_EDIT.

**Test-data recipes — which ticket + role produces which state** (use per M17 when a case is blocked for missing data):

| Need (state/data) | Recipe ticket | Role | Notes |
|---|---|---|---|
| Create an LP | OLS-24 `[LP,Create]` | Creator | |
| Enroll + progress (กำลังเรียน/เรียนจบ/progress ต่างกัน) | **OLS-29** `[LP] Enroll & Learn` · OLS-47 `[Profile-Learner]` | Learner | enroll then complete lessons through UI |
| PendingEdit (รอแก้ไข) | OLS-55 `[LP,Update]` | Creator | edit a Published LP → becomes รอแก้ไข |
| Deleted (ถูกลบ) | OLS-56 `[LP,Delete]` | Creator | "ลบ" button shows only for Draft/PendingEdit; **soft, recoverable**; safe to delete a throwaway LP you create |
| Unpublished (ยกเลิกเผยแพร่) | OLS-57 `[LP,Unpublish]` | Creator | ดูรายละเอียด → ยกเลิกการเผยแพร่ → confirm; reversible |
| Flagged (ถูกรายงาน) | OLS-31 `[Moderation][Learner] report` (+ OLS-32 Admin) | Learner reports | needs a non-owner user + report-count threshold → may be hard/Blocked |
| (media) rejected/approved | OLS-86 `[Admin] Approval/Reject` | Admin/approver | vote-based, **media only, not LP** |

**Login gotcha:** the NDLP68 landing page shows a royal **"commemorative modal"** that intercepts the login button — dismiss it first (`button[aria-label="Close commemorative modal"]` or press Escape) before the PDPA + login steps. See [ols-login-runbook.md](https://github.com/Thitic9203/ols-qa-evidence/blob/main/docs/ols-login-runbook.md).

**Headless MP4 + screenshot capture harness:** `~/ols-qa-testing-bot/capture/ols_capture.js` (Playwright + ffmpeg) — the Stage 4.4 MP4 capability. Details: agent memory `reference_ols-mp4-capture`.

## Content-detail click pitfall — two buttons named "บันทึก" (learned OLS-721 retest, 2026-09-24)

On the content-detail pages (`/content/media|course|learning-path/{id}`) the label **"บันทึก"** belongs to **two different buttons**:
the content **bookmark** toggle (`aria-pressed`, calls `POST|DELETE /api/activities/bookmarks/{type}/{id}`) and the **save** button of an
open comment edit box (calls `PATCH /api/activities/comments/{id}`). Their document order differs per page type, so a page-wide
`getByRole('button', {name:'บันทึก'}).first()/.last()` picks the bookmark on course/LP pages even when it happens to work on media.
Any script that clicks a write button here must scope it to the container of the thing being edited and assert that the request the
click produced is the intended endpoint — stop on anything else. Post-mortem #0144.

## Comment list and replies — facts for test scripts (learned OLS-829, 2026-10-08)

| Action | Endpoint (media / course / learning-path ใช้รูปเดียวกัน) |
|--------|-----------------------------------------------------------|
| list | `GET /api/activities/{media\|course\|learning-path}/{id}/comments?limit=20&sort=createdAt:desc&cursor=<createdAt>\|<id>` → `{data,total,nextCursor,hasMore}` |
| new comment | `POST` path เดียวกัน body `{text}` → 204 ไม่มี body |
| replies | `GET\|POST /api/activities/comments/{id}/replies?limit=20&cursor=…` |
| delete | `DELETE /api/activities/comments/{id}` |

- **ทุกการเขียนต้องส่ง header `x-ols-csrf: 1`** · POST ตอบ 204 ไม่มี id กลับมา ต้อง GET อ่าน id เอง
- **ใต้ comment หนึ่งรายการมีปุ่มที่มีคำว่า "ตอบกลับ" 3 ปุ่ม:** "ตอบกลับ" (เปิดช่องตอบ) · "แสดงอีก N ตอบกลับ" (โหลด Reply เพิ่ม) · "ซ่อนตอบกลับ" (หุบ Reply) — กับดักแบบเดียวกับ "บันทึก" ด้านบน · ถ้าเลือกแบบ substring เช่น `getByRole('button',{name:'ตอบกลับ'}).last()` จะไปโดน "ซ่อนตอบกลับ" แล้ว Reply หุบ ดูเหมือนบัคของแอป · ต้องเลือกด้วยชื่อตรงตัวเสมอ (`exact:true`, `/^แสดงอีก/`)
- **ช่องพิมพ์ไม่มีปุ่มส่ง** พิมพ์แล้วกด Enter
- **Media:** comment อยู่ในแผงด้านข้าง (`[data-panel=comments]` เปิดด้วยปุ่ม "ความคิดเห็น") ช่องพิมพ์อยู่ล่าง · หน้าหลังเป็นฟีดวิดีโอแนวตั้ง ให้เลื่อน scroll container ของรายการ comment เอง ห้ามเลือก scroller ที่ใหญ่ที่สุด (จะเลื่อนฟีดไปวิดีโออื่น)
- **Course / Learning Path:** comment อยู่ในการ์ดหรือแท็บ "ความคิดเห็น (N)" ช่องพิมพ์อยู่บน
- **ตัวเลขบนแท็บความคิดเห็นนับ comment รวม Reply** ส่วนดีไซน์นับเฉพาะ comment หลัก — ยังรอ PO ตัดสิน
- **ถ่ายภาพแท็บเบื้องหลัง:** `Page.captureScreenshot` ใช้ได้บนแท็บเบื้องหลังของ Chrome แยกโปรไฟล์ · มีเลนหนึ่งเจอ timeout แล้วใช้ MHTML (`Page.captureSnapshot`) แทน · ห้ามดึงแท็บขึ้นมาข้างหน้าเพื่อเอาภาพ เพราะจะแย่งหน้าจอผู้ใช้
- **session หลุดโดยไม่รู้สาเหตุ (2026-10-08):** account Teacher หนึ่งตัวบน Dev ได้ `get-session` = 200 แต่ body ว่าง ประมาณ 90 นาทีหลัง login ทั้งที่ cookie ยังไม่หมดอายุ ขณะที่อีก account ที่ login นาทีเดียวกันยังใช้ได้ · ยังไม่รู้สาเหตุ · ทุกเลนต้องเช็ค `get-session` ก่อนนับผลทุกครั้ง

## Content name guard (ชื่อที่ผู้ใช้จริงเห็น) — pre-prod only, 11:00 + 17:00

Any user-visible name carrying a QA/test trace, gibberish, a ticket key, a status marker in
parentheses, profanity, or a duplicate title is a **live defect**, not a QA artefact — as is a
published item with no cover. Tool + rules: [`tools/name-guard/`](../tools/name-guard/README.md).

| where | runs on | note |
|---|---|---|
| pre-prod | local launchd `com.thitichaya.ols-name-guard-preprod`, **11:00 and 17:00 daily** | VPN-only private address, so it must run from a machine of ours. Registered in SFD as a **calendar** job: a closed laptop simply misses the run — that is not a failure and raises nothing. Skips (exit 0) when off VPN |
| **training** | **nothing** | 🔴 hands-off. Real people work there |

🔴 **training is not scanned, not polled, not alerted on** (owner instruction 2026-08-13). The
requirement is stated in terms of the **QA thread**: an alert that checked training must never
appear in it. So the refusal sits on every layer that could put one there, not on the schedule
alone — the GitHub Actions job that scanned it every 30 minutes was **deleted**; `run_guard.sh`
refuses a training label; **`scan.js` refuses before it loads a browser** (`exit 2`, never `0`);
**`notify.js` refuses to post a report whose env, origin or any finding mentions training**
(`exit 5`, and `--force` does not override it); the daily health check dropped training from its
config **and** filters it out in code. No layer has an override flag — the previous version had
one, and an override that exists is an override that eventually gets used.
`write_guard.test.js` fails if any of that erodes: a workflow that schedules a scan or names a
training environment, a scanner that stops consulting the hands-off guard or moves the check below
its browser import, or a notifier that would post a training report. Writing to training is
separately refused seven ways — see [[project_ols-write-guard-training-readonly]].

**One alert per change, not per run.** `alert_dedup.js` fingerprints the finding set
(`id|rule|field`, catalogue counts excluded) and stays quiet when nothing changed, checking both a
local state file and the last alert still in the channel. Re-reporting the same pending items
buries the channel — the owner asked for it once, not every run.

**A missing cover is not a bad name.** Names, covers and duplicate titles are counted and worded
separately; a cover-only finding never asks anyone to rename anything.

### 🔴 List endpoints disagree on the array key — `data` vs `items` (2026-08-13)

| endpoint | envelope |
|---|---|
| `/api/media` · `/api/achievements` | `{ "data": [...], "total", "page", "limit" }` |
| `/api/courses` · `/api/learning-paths` | `{ "items": [...], "total", "page", "limit" }` |

Read with `j.data \|\| j.items \|\| (Array.isArray(j) ? j : [])` — always. A reader that only
looks at `data` gets an **empty course/LP list next to a healthy `total`** (`200 n=0 total=67`),
which is indistinguishable from a backend outage. That exact illusion was diagnosed as an
"intermittent empty catalogue / index rebuild" for a while before anyone printed the raw body;
the API was never at fault. Pinned by `tools/name-guard/list_envelope.test.js`.

`page` is 1-based (`page=0` → 400) and `limit` maxes at 50 (`limit=100` → 400).

**Rule that follows:** before theorising about a remote system, print the raw response body and
headers once. One `console.log` of the envelope would have replaced an hour of hypotheses.

### Write-model facts learned while fixing names (2026-08-13)

- **No `PATCH` exists** on `/api/achievements/{id}`, `/api/media/{id}`, `/api/courses/{id}`,
  `/api/learning-paths/{id}` — every one returns `404 Cannot PATCH`. Renaming = **full-object `PUT`**:
  `GET` the object, drop server-managed fields, change the one field, `PUT` it back, then re-read.
- **Achievements**: the `GET` read-model is not the write-model — `levels[]` comes back with a nested
  `badge` object + `receivedCount`, but `PUT` wants `{key, targetValue, badgeId}`. Sending the read
  shape back fails `400 levels: Required`.
- 🔴 **LIVESTREAM media cannot be renamed at all.** `PUT /api/media/{id}` validates
  `type` against `'VIDEO' | 'ARTICLE' | 'EBOOK' | 'DOCUMENT'` — `LIVESTREAM` is not an accepted
  discriminator, and no livestream-scoped update route exists (`/api/livestreams/{id}` `PUT`/`PATCH`
  = 404). A live-recording with a bad title can only be **deleted** (`DELETE /api/media/{id}` → 204).
- 🔴 **A `FLAGGED` media cannot be unpublished**: `409 media.invalid_status_transition — Media status
  FLAGGED cannot transition via UNPUBLISH`. Hiding a reported item is not available; the paths are
  admin UNFLAG (back to PUBLISHED first) or delete.
- Guest sees neither `FLAGGED` nor `UNPUBLISHED` media (`GET /api/media/{id}` → `409`), so those
  states are already invisible publicly — the bad names still show on **creator** and **admin** screens.

### Editing a PUBLISHED learning path (cover fix, 2026-08-13)

A published LP is read-only: `PUT /api/learning-paths/{id}` answers `409 learning_path.not_draft`.
The edit path is three calls, and the **method matters** — `request-edit` is a `PATCH`, not a `POST`
(a `POST` returns 404 and reads like a missing route):

1. `PATCH /api/learning-paths/{id}/request-edit` → status becomes `PENDING_EDIT`
2. `PUT /api/learning-paths/{id}` with the full write-model — `title`, `description`,
   `subLearningGoals:[{id,priority}]`, `gradeLevels`, `courseIds` (ordered by the read model's
   `courses[].sequence`) — plus `coverImageKey` from `POST /api/uploads {purpose:'thumbnail'}`
3. `POST /api/learning-paths/{id}/publish` → back to `PUBLISHED`

`POST …/republish` is **not** the restore call here: from `PENDING_EDIT` it answers
`409 learning_path.invalid_status` (it applies to `UNPUBLISHED`). Never leave an LP parked in
`PENDING_EDIT` — verify each one reads `PUBLISHED` again before calling the work done.

## Daily health check — pre-prod only, 12:00 and 18:00

Twice a day an unattended run checks **pre-prod** for things that make the product unusable — the
site not answering, sign-in failing, the catalogue APIs not returning data, or a core page
rendering blank / erroring. Tool + config live **off-repo** at `~/ols-qa-testing-bot/health/`
(real hosts and accounts must never enter this public repo).

🔴 **Training is not checked — and dev was dropped with it (owner instruction 2026-08-13).** This
run used to sweep all three environments; on training that meant a real login and a real probe
against real people's live work twice a day, which is the same thing the name-guard scan was
stopped from doing. Training is now refused **three** ways, none of which depends on remembering:
its entry was deleted from `health_config.json`; `ols_daily_health.js` filters out any env whose
key **or host** matches `/training/i` and prints what it dropped; and `tools/name-guard/scan.js`
refuses a hands-off environment before it even loads a browser (`exit 2`, never `0` — a refusal
must not read as "scanned, clean"). `namecheck/envs.js` no longer carries a training profile and
**throws** if one is asked for. There is no override flag anywhere on purpose.

| piece | what it is |
|---|---|
| `health/ols_daily_health.js` | the checker: VPN → reachability → checks → 5-layer gate → duplicate guard → file |
| `health/run_daily_health.sh` | launchd entry point, wrapped in the SFD harness (fail-loud, watchdog 90 min) |
| `com.thitichaya.ols-daily-health` | launchd job, `StartCalendarInterval` 12:00 + 18:00 daily |
| `sfd/workflows.json` | registered `type: calendar`, so the heartbeat catches a run that never happens |

**Checks per env:** `fe-reachable` · `auth-login` (real account against the env's auth API) ·
`api-catalogue` (media / courses / learning-paths — reads **both** `data` and `items` envelopes) ·
`page-render` (Playwright over core routes, flags blank page / error boundary / JS exception).

**VPN is brought up, never used as an excuse to skip.** pre-prod sits behind the tunnel. The
run probes real reachability first, and only if nothing is connected does it try `scutil --nc start`
on each service in turn, then waits and retries for up to 40 minutes. It **never** issues a start
while another tunnel reports Connected — doing so tears down an active FortiClient session (the
mistake that made both older bots drop that call). If it still cannot get in, the env is reported as
not-checked **and the owner is notified** — it is never dropped quietly.

**A finding becomes a bug only after the 5-layer gate** (systematic debugging):

| layer | must show |
|---|---|
| 1 reproduce | fails on every one of N consecutive samples |
| 2 isolate | which boundary broke (site → API → auth → render), incl. a control call that proves the API itself is alive |
| 3 cross-env | the same check run on any other environment still in the config — with pre-prod alone in it, this layer records "no comparison available" rather than inventing one (training is never used as the comparison) |
| 4 rule out our side | control probes prove the tester's own network is fine; if not, nothing is blamed on the product |
| 5 persistence | still failing across the whole watch window, with first-seen / last-seen / duration recorded |

**Duplicate guard — an open bug blocks a new one, absolutely.** Before filing, the run reads every
OLS bug that is not Done and matches on its own `healthcheck:<env>:<check>` marker **or** on wording
plus environment. It reads the **custom fields** (`customfield_12114/12116/12113/12112/12111` and the
environment field), because OLS bugs keep their content there and leave `description` empty — a guard
that reads only summary/description finds nothing and files a duplicate. A **Done** bug does not
block: that is a recurrence and earns a fresh ticket. When an open bug is found, the run adds a
recurrence comment with the new time window instead of filing.

Filed bugs carry the active sprint (read live from the board) and state the date, time and duration
of the incident in the actual-result field.

## Default assignee / reporter

*(not configured — ask user and update this table)*

## Preferred CSV format

Default: UTF-8, comma-separated, with header row (per `references/csv-export-rules.md`).
