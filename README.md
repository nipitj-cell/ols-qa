# OLS QA Workspace

Helix QA assistant pre-configured for the **OLS** project at <ORG>.

Helix skills embedded directly — no separate install needed.

**OLS Workspace version: v1.55.189** (13 Nov 2026) — Helix skills vendored in-repo (see *Helix commands* below)

## Quick start

Open this folder in **Claude Code** and trust the project. The SessionStart hook injects OLS context automatically.

## Auto-update

Skills update themselves at session start — to the newest **release**, never to an unreleased `main`:

- A release tag `vX.Y.Z` is created by `auto-version.yml` only after the `tests` workflow passed on that commit.
- Each session `scripts/ols-qa-auto-update.sh` asks origin for its release tags (one cheap `git ls-remote`); it fetches and fast-forwards only when a newer release exists (or every 4 h as a fallback). It prints `=== ols-qa skills updated to vX.Y.Z ===` when the clone moved.
- It never moves a clone backwards, and never touches a clone that is on another branch, has modified tracked files, or has local commits on `main` — the last two are reported once at session start (log: `~/.ols-qa/auto-update.log`).

Sessions opened inside this folder update automatically. To also update in sessions opened anywhere else, add a user-level hook (needs `jq`; backs up `~/.claude/settings.json` first, safe to re-run):

```bash
bash scripts/install-auto-update.sh              # install
bash scripts/install-auto-update.sh --uninstall  # remove
```

Opt out for a session or machine: `export OLS_QA_AUTO_UPDATE=0`.

## What this workspace can do

Three ways of working, all pointed at the OLS project:

- **A. Interactive skills** — you run these yourself in Claude Code (see *Helix commands*): design test
  cases (`/tc-fe-prep`, `/tc-api-prep`), run a Playwright test (`/testing-ticket`), re-verify a dev fix
  on a **bug or a task** (`/retest-bug`), file bugs (`/create-bug`), or prepare/seed OLS test data — media,
  courses, learning paths, covers, videos, accounts (`/test-data-prep`). Both test workflows compare every
  screen against its **Figma** node and stop to ask when a screen has no design reference.
- **B. Discord-driven testing** — a bot on the QA Mac tests tickets headless and reports back:
  - **On request** — type `/bot-testing OLS-xx` in the QA thread; it auto-routes (Bug → retest, Story →
    test). See *On-request testing*.
  - **Automatic (autopoll)** — every 2 h it finds ready tickets and asks in the thread; the first person to
    answer claims them, one **Yes** runs them. See *Automated testing trigger*.
- **C. Background automations** — scheduled jobs keep the pipeline running unattended: TC drafting, auto-flip
  of started stories to TESTING, QA-owner sync, the hourly test-type deliverable sync, a daily login
  smoke-test, auth-token refresh. See *Background automations*.

Each is detailed below.

## How the tests actually run (headless Chrome + Playwright)

Both testing skills drive a real browser in **headless Chrome** — invisible, never steals the user's
screen — using **Playwright** as the automation framework (reached through the `superpowers-chrome`
`use_browser` tool; MP4 capture uses an off-repo Playwright + ffmpeg harness). Every scenario is driven
through its **real surface** (UI scenario → clicks through the UI; API-layer scenario → the API call).

| Skill | Browser | Framework | Evidence |
|-------|---------|-----------|----------|
| `/testing-ticket` (story test) | headless Chrome | Playwright (+ ffmpeg for MP4) | whole-flow **MP4** + one screenshot per Expected-Result item → Google Sheet + Drive |
| `/retest-bug` (re-verify a fix) | headless Chrome | Playwright (+ ffmpeg for MP4) | whole-flow **MP4** per case, **plus** a screenshot on text-verification cases — attached to the **Jira comment** (not Drive) |

The unattended `/bot-testing` bots run the same skills fully headless on the QA Mac and write results back
over the Jira REST API — they never touch a visible browser or the user's screen.

## Helix commands

| Command | What it does |
|---------|-------------|
| `/helix` | Main menu — pick a workflow |
| `/tc-fe-prep` | Frontend TC (Thai) from a story — รีเช็คคำจาก TC glossary ให้ยืนยันก่อน แล้ว outputs Jira comment + สูงสุด 5 CSV attachments (Draft_Jira, Import_Qase, Unit_Test, Integration_Test, System_Test) |
| `/tc-api-prep` | API test cases from spec + Swagger |
| `/retest-bug` | Verify a fix on a Jira bug, capture a whole-flow MP4 (+ screenshot on text-check cases) into the Jira comment, verdict + comment |
| `/testing-ticket` | Playwright test for a ticket, optionally update results |
| `/create-bug` | Open bug(s) on Jira |
| `/catch-ai` | Audit finished work — your own output, a document, a report, or a feature — into sourced findings, open questions, coverage gaps, and a verdict. Run before claiming a check passed, a defect exists, or work is complete |
| `/tc-review` | Review an already-written TC document against a ticket's AC/EC and business rules — traceability matrix, row-quality check, Good vs Need Improve findings anchored to quoted sources |
| `/tc-change-format` | Copy each ticket's TC tab from a Google Sheet into a new sheet made from the release TC template, in the release folder you pick; optionally record the delivered file in the tracking sheet (OLS values in `references/ols-project-guide.md` § TC change format) |
| `/smoke-test` | **OLS-local** — post-deployment smoke test of OLS core features on a named env; triage every non-passing case to a verified root cause; output a one-page A4-landscape PDF summary + the Playwright per-case report and post to the QA release channel |
| `/review-result` | **OLS-local** — review already-recorded results + their evidence clips: one contact sheet per clip, judge each case against the 10 review criteria, record PASSED / FAILED / AWAITING RE-REVIEW |
| `/sync-tc-result` | **OLS-local** — route every TC result from the QA source sheet into the 3 test-type deliverable sheets (System / Integration / Unit), all-or-nothing per tab behind a 5-layer gate. Run manually — the hourly `ols-tc-result-sync` launchd job is frozen (2026-08-11) |
| `/content-takedown` | **OLS-local** — take a set of published content items out of public view: inventory the set, health-check, pick the least-damaging mechanism the accounts can use, execute, verify |
| `/test-data-prep` | **OLS-local** — prepare/seed/fix OLS test data (media · course · LP · cover · video · account) per `ols-data-prep.md`; full ordered Gate 0 intake (env + account + CF URL → data types → style/qty → details) then every quality gate before use |

Contributor commands (developing Helix, not QA workflows): `/helix-check` (regression check before merge) · `/helix-release` (verify and ship Helix changes to main; CI owns the version bump).

## Android SuperApp testing — เริ่มใช้ (`/testing-ticket`)

ทดสอบเว็บแอปที่เปิดอยู่ในแอป SuperApp บน Android emulator: อัดคลิปแยกตาม AC แสดงรอยแตะ ตรวจคลิปก่อนส่ง อัปโหลดขึ้น Drive ตั้งชื่อตาม AC แล้วทำร่างคอมเมนต์ Jira ให้คนโพสต์เอง กติกาทั้งหมดอยู่ใน [android-superapp-branch.md](skills/procedures/testing-ticket-workflow/references/android-superapp-branch.md) (spec: `docs/sdd/mobile-superapp-testing/spec.md`)

**ต้องมีในเครื่องที่รัน**

| ของที่ต้องมี | หมายเหตุ |
|---|---|
| Android Studio + emulator + `adb` | ใช้ image แบบ `google_apis` (debuggable) จะอ่านหน้าเว็บได้ครบ ถ้าเป็นอิมเมจ Play Store กดด้วย OCR และการวัดที่ต้องอ่าน DOM จะเป็น BLOCKED |
| Node.js ≥ 18 | ตัวช่วยใน `tools/superapp-test/` ไม่มี dependency |
| macOS (ไม่บังคับ) | ตัว OCR และตัวทำแถบเฟรมเป็น Swift: `swiftc -O tools/superapp-test/swift/ocr.swift -o ocr` (คอมไพล์ทีละไฟล์) ถ้าไม่มี สกิลจะบอกว่าตรวจข้อไหนไม่ได้ |
| Chrome ที่ล็อกอิน Google | ใช้ตอนอัปโหลดคลิปขึ้น Drive (อัปทีละไฟล์ ไฟล์ละไม่เกินประมาณ 7 MB เพราะตัวส่งนับขนาดแบบ base64 รวมต่อรอบไม่เกิน 10 MB) |
| APK ของแอป, VPN, บัญชีทดสอบ | ขอจากผู้ดูแลระบบ ไม่อยู่ใน repo ค่าจริงเก็บใน `references/` ของ workspace ตัวเอง (ใน repo มีแต่ placeholder) |

**ขั้นแรก**
1. เปิดโฟลเดอร์นี้ใน Claude Code แล้ว trust โปรเจกต์ จากนั้นพิมพ์ `/testing-ticket` ตามด้วยลิงก์การ์ด
2. ตอบช่อง intake ในข้อความเดียว: แพลตฟอร์ม = `Android SuperApp`, ชื่อ AVD, บัญชี (ไม่ใช้รหัสผ่าน), VPN, ปลายทางอัปโหลดคลิป และนโยบายไฟล์ชื่อซ้ำ
3. ล็อกอินบน emulator เอง สกิลไม่พิมพ์รหัสผ่านและหยุดทุกครั้งที่เจอหน้า login
4. ตรวจแผนที่สกิลแสดง แล้วยืนยันก่อนเริ่มอัด สกิลไม่เริ่มก่อนยืนยัน

**ข้อจำกัดที่ควรรู้:** emulator หนึ่งเครื่องให้ session เดียวขับต่อครั้ง ไม่เปิดบั๊กเอง ไม่บันทึกสื่อเข้าระบบเว้นแต่ถูกอนุญาตตอนยืนยันแผน และผลที่ได้จากแถบเฟรมจะระบุว่าเป็นแถบเฟรม ไม่ใช่การวัด

## OLS links

- **Jira board:** https://<ORG>.atlassian.net/jira/software/projects/OLS/boards/818/backlog
- **Confluence:** https://<ORG>.atlassian.net/wiki/spaces/<CONFLUENCE_SPACE>/folder/<CONFLUENCE_FOLDER_ID>
- **Figma:** https://www.figma.com/design/<FIGMA_FILE_ID>/OLS_Working-file
- **Qase:** https://app.qase.io/project/OLS

## Project config

All OLS-specific config (test env URLs, default assignee, etc.) lives in [`references/ols-project-guide.md`](references/ols-project-guide.md).
Update it as new info arrives — AI reads it before asking questions.

## On-request testing — `/bot-testing`

Type `/bot-testing OLS-<key>` in the QA Discord thread to test one ticket on demand (same bot/listener as
autopoll, so it also runs headless on the QA Mac). It reads the ticket type from Jira and routes
automatically:

- **Bug → retest** — re-verifies the dev's fix against the bug's Expected Result, attaches evidence, then
  **writes the verdict back to Jira** (comment + status transition) and notifies the QA thread.
- **Story → test** — runs the ticket's reviewed test cases with Playwright and writes results to the
  **Google Sheet + Drive** (screenshots / MP4); it **does not touch Jira**.

Anyone in the thread can trigger it. Only one run executes at a time — a lock serialises `/bot-testing` and
autopoll together, so they never collide on the single OLS account.

## Automated testing trigger (autopoll)

A background service that watches the QA tracking sheet and offers to start testing whenever tickets are
ready — you confirm once in Discord, it runs the rest headless. This is **OLS-specific infrastructure**,
not a helix skill: it lives outside this repo in the testing bot (`~/ols-qa-testing-bot/listener/index.js`,
run by a launchd `KeepAlive` job) and is additive to the on-request `/bot-testing` command in the same
listener. Ownership of tickets it tests is claimed automatically (see step 7).

### Eligibility

A ticket is offered for testing only when **all** of these hold (checked against the
[QA tracking sheet](references/ols-project-guide.md#qa-tracking-sheet-ticket-list--tc-status)):

- **Status** = `READY TO TEST` (Summary tab)
- **TC Status** = `QA Reviewed` (Summary tab)
- Its per-ticket tab still has **≥ 1 test case with Test Status = `NOT STARTED`** (i.e. real work is left)

The scan reads Google Sheets over an OAuth token, so it works without the NDLP VPN.

### The 2-hour cycle

The scan (`scanTick`) runs **every 2 hours**, plus once ~15 s after the listener (re)starts. Each cycle
short-circuits in order:

1. **NDLP VPN not connected** → silent skip, wait for the next cycle (testing can't run without it, so it
   doesn't ask)
2. **A prompt is still awaiting an answer** → wait (never stack a second prompt; an unanswered prompt
   expires after **12 h**)
3. **A test run is active** (a `/bot-testing` run or an autopoll run holds the lock) → skip this cycle
4. **The queue is non-empty** → skip (still draining)
5. **Scan the sheet** for the tickets still `NOT STARTED`, then split them:
   - **Unfinished** — a ticket we already launched that is *still* `NOT STARTED` (its run ended without
     completing, e.g. VPN dropped mid-run). It resumes automatically — see *Resume unfinished runs* below.
   - **Fresh** — never launched, not declined in the last **24 h**, not already queued → offered for testing.
6. **Nothing fresh** → silent
7. **Fresh tickets found** → post **one** prompt in the QA review thread on Discord listing all of them,
   with **Yes / No** buttons (ownership is claimed on the first click — see *Ownership* below)

### Confirm once → serial queue

- **Yes** → every ticket in that prompt is queued, and the queue drains **one at a time** — `drainTick`
  (every 60 s) launches `run.sh <ticket>` for the next ticket only once no run holds the lock. Each run is
  the normal test flow, starting from the VPN check.
- **No** → those tickets are suppressed for **24 h**, then become eligible again.

**Invariant — one confirmation per batch:** a single prompt covers all eligible tickets and a single
**Yes** approves the whole batch. The bot **never** re-confirms ticket-by-ticket; it just queues them and
tests serially.

### Ownership — first click claims the batch

Anyone in the QA thread can answer — this is how the whole team uses one central bot (there is nothing to
deploy per person; deploying the bot on more than one machine is **not** supported — the runs share a
single OLS account and would collide). **The first person to click (Yes *or* No) becomes the QA Owner** of
every ticket in that prompt: the bot writes `customfield_12120` in Jira to that clicker (assignee
untouched), and the sheet's QA Owner column follows via the hourly Jira→sheet sync. This claims the
tickets so no one else picks them up. The Discord-user → Jira-account mapping lives in
`~/ols-qa-testing-bot/.qa-roster.json`; if the clicker isn't in it, the tickets are still queued or
suppressed but ownership is left unset and a warning is shown (add the person to the roster). The test run
itself always executes centrally on the QA Mac, whoever clicked.

### Resume unfinished runs

A launched run can end without finishing — the NDLP VPN drops mid-session, the machine sleeps, or the run
hits its timeout. The ticket's test cases then stay `NOT STARTED` in the sheet. **Such a ticket is never
dropped: the next cycle picks it up and continues it automatically, without asking again** (the batch was
already approved). Concretely, once no run holds the lock, any ticket we launched that is *still*
`NOT STARTED` is re-queued and re-run. Each `run.sh` launch already retries 3× internally; the autopoll
layer resumes a ticket up to **2 more times** (`MAX_AUTO_RETRY`). If it still hasn't completed after that,
it is suspended for **24 h** with a Discord notice (run `/bot-testing <KEY>` to force it sooner). A ticket
whose status moves off `NOT STARTED` (i.e. it finished) is forgotten and never re-run.

### Why buttons (not a typed yes/no)

The bot runs without Discord's privileged **Message Content** intent, so it can't read the text of a typed
reply. Buttons emit an interaction that routes back without that intent. The result is rendered by
**editing the prompt message over the bot token** (not the interaction response) because this gateway link
can deliver interaction events after Discord's 3-second reply window has closed — editing over the bot
token is independent of that window and never fails with a stale-interaction error.

### State & operation

Durable state lives in `~/ols-qa-testing-bot/.autopoll_state.json`
(`{pending, declined, queue, launched, attempts}`) and survives restarts. Key constants: scan **2 h** ·
drain **60 s** · declined **24 h** · auto-resume cap **2** · settle window **120 s** · pending-prompt
expiry **12 h**. Team roster (Discord user → Jira account) for ownership:
`~/ols-qa-testing-bot/.qa-roster.json`. Logs: `~/ols-qa-testing-bot/logs/listener.out.log` (look for
`autopoll armed`, `auto-resume`, `QA Owner ->`). Restart after editing:
`launchctl kickstart -k gui/$(id -u)/com.<USER>.ols-testing-listener`.

## Automated TC auto-draft (เดิมทุก ~4 ชม.)

> **สถานะปัจจุบัน: ปิดใช้งาน (2026-07-25).** launchd job `ols-tc-autodraft` และตัวคู่ `ols-tc-token-check` ถูก disable ตั้งแต่ 25 ก.ค. 2026 (ไฟล์ plist ถูก rename เป็น `.disabled-2026-07-25` จึงไม่ถูกโหลด) — ส่วนด้านล่างเก็บไว้อธิบายวิธีทำงาน "ตอนเปิด" เป็น reference หากจะเปิดใช้อีกครั้ง

งานอัตโนมัติที่ **ร่างเทสเคส FE** ให้ ticket ที่ยังไม่มี TC แล้วเขียนลง **QA tracking sheet** โดยตรง — เพื่อให้ทีม QA
มี TC ตั้งต้นรอรีวิว ไม่ต้องเริ่มจากศูนย์ เป็น **OLS-specific infrastructure** (launchd bot บนเครื่อง QA) ไม่ใช่ helix skill
และ **แยกจาก autopoll** ด้านบน (คนละงาน: autopoll = รันเทสต์ ticket ที่ TC พร้อมแล้ว; ตัวนี้ = ร่าง TC ให้ ticket ที่ยังไม่มี TC)

### Eligibility

Ticket จะถูกร่าง TC ให้ เมื่อ **ครบทุกข้อ** (เช็คกับ tab **Summary** ของ
[QA tracking sheet](references/ols-project-guide.md#qa-tracking-sheet-ticket-list--tc-status)):

- **TC Status** = `TO DO`
- **Ticket Detail Status** = `Details Provided`
- **ยังไม่มี TC** — ยังไม่มีแท็บของ ticket นั้น หรือมีแท็บแต่ว่าง

ticket ที่มี TC อยู่แล้ว **แม้ยังไม่ครบ** = **ข้าม** ให้คนจัดการต่อ การสแกนอ่าน Google Sheets ผ่าน OAuth token
จึงทำงานได้โดยไม่ต้องต่อ VPN แต่ตัว bot จะ **ทำงานจริงเฉพาะช่วงที่เปิดคอม + ต่อ NDLP VPN อยู่** ถ้าไม่ครบเงื่อนไข = อยู่เงียบ

### ขั้นตอน (ยึดวิธีนี้ทุกรอบ)

1. **Scan** — หา ticket ที่เข้าเกณฑ์จาก tab Summary
2. **Triage** — ถ้า ticket **ไม่มี AC/EC** เลย → **ไม่ร่าง** (ห้ามมโน) แค่เขียน note ที่ช่อง Remark ของ Summary;
   caveat อื่น (Jira status = BLOCKED / In Progress / REVIEWING, PO รอ Figma, comment ที่ AC/EC ยังเปลี่ยน) →
   เก็บเป็นโน้ต `Need QA recheck: …`
3. **Draft (parallel)** — ยิง subagent 1 ตัวต่อ 1 ticket พร้อมกัน ป้อน AC/EC แบบ verbatim จาก Jira เพื่อกันการแต่งเติม
   แต่ละตัวออกแบบ TC ให้: ทุกเคส trace กลับ AC/EC จริง — **ครบทุก AC + EC**, ไม่เกินขอบเขต; `Type` = Unit /
   Integration / System **เฉพาะ layer ที่ AC/EC รองรับจริง** (ไม่แต่ง TC มา filler); เนื้อหาไทยทางการ;
   `Test Case ID` = `TC_01, TC_02, …`; `Test Status` เริ่มต้น = **`Not Started`**
4. **Verify** — ตรวจ coverage (AC/EC → TC) ของทุก ticket ก่อนเขียนลงชีท
5. **Write** — สร้าง **แท็บใหม่** ต่อ 1 ticket ตามฟอร์แมต tab **`OLS-44`** (16 คอลัมน์: Acceptance Criteria ·
   Services Impacted · Test Case ID · Test Title · Precondition · Test Data · Test Steps · Expected Result ·
   Priority · Type · QA Owner · Test Status · Actual Result · Capture Screen Link · Linked Bug · Remark) →
   เพิ่มแถวใน tab **`Test Progress - ALL TC`** → เขียนโน้ตที่ช่อง Remark ของ tab **Summary**
6. **ไม่แตะ** ค่า `TC Status` ใน Summary (ให้ QA เปลี่ยนเอง) และ **ไม่เขียน Jira**

ความขัดแย้งใน ticket (description/comment) ถูกบันทึกที่ช่อง Remark ของแท็บนั้นเสมอ เช่น `Need QA recheck เกี่ยวกับ…`
ผลลัพธ์ทุกชุดเป็น **Draft** — ต้องผ่านการรีวิวจาก QA ก่อนใช้งานจริง Sheet, tab, และ gid อยู่ใน
[`references/ols-project-guide.md`](references/ols-project-guide.md) → ตาราง **QA tracking sheet**

### ตารางเวลา, resume งานค้าง & self-healing

Bot อยู่ที่ `~/ols-qa-tc-autodraft-bot/` (นอก repo): `run.sh` (VPN gate + lock + pre-scan → เรียก
headless `claude --print prompt.md` เมื่อมีงานจริง) · `scan_todo.py` · `write_tabs.py` (generic,
validate fail-closed) · `check_token.sh` (token probe + alert) · `prompt.md` (วิธีทำ). ใช้ secret ร่วมกับ
bot อื่น (claude token, Jira, Google OAuth) — ไม่มี secret อยู่ใน repo.

- **ตารางเวลา** — launchd `com.<USER>.ols-tc-autodraft` ยิงทุก 4 ชม. **ตรงเวลานาฬิกา 00 / 04 / 08 / 12 /
  16 / 20 น.** (`StartCalendarInterval`, caffeinate). รอบที่เครื่องหลับ/VPN ลง = ข้ามเงียบ
- **Resume งานค้างอัตโนมัติ (ชีทคือ state เอง — ไม่มีไฟล์จำสถานะให้ drift)** — scan คิดค่า **`needsTC`** =
  ไม่มีแท็บ **หรือแท็บมีแต่ว่าง** (รอบก่อนสร้างแท็บแล้ว crash/timeout ก่อนเขียน → รอบหน้าเห็นว่าว่าง → ทำต่อ).
  แต่ละรอบ draft ไม่เกิน **`OLS_MAX_PER_ROUND` = 6** ticket (ที่เหลือไปต่อรอบหน้าเอง) → รอบสั้น timeout ยาก;
  ตราบใดยังไม่เขียนจริง = ยัง `needsTC` = ถูกหยิบซ้ำ **ไม่มีวันโกหกว่าเสร็จ**
- **กันรัน run เปล่า** — ticket ที่ถูก flag ว่า **ไม่มี AC/EC** (ร่างไม่ได้) จะถูกอ่านจาก Summary Remark แล้ว
  **ไม่ trigger รอบใหม่** จนกว่าคนจะเคลียร์ Remark / ticket เปลี่ยนสถานะ
- **Token guard (renew อัตโนมัติไม่ได้ เพราะ `claude setup-token` เป็น browser-OAuth)** — `check_token.sh`
  probe token แบบถูกๆ; ถ้า stale เด้ง **แจ้งเตือน macOS + Discord** พร้อมคำสั่งแก้ ใช้ 2 จุด: (ก) **preflight
  ใน run.sh** (token เสีย = เตือน + ข้ามรอบ ไม่เผา run ทิ้งเงียบ) · (ข) **monitor รายวัน 09:30**
  (`com.<USER>.ols-tc-token-check`) เตือนล่วงหน้าก่อนรอบเที่ยง. Logs: `~/ols-qa-tc-autodraft-bot/logs/`
  (`bot.log`, `token.log`). ทดสอบ scan-only: `DRYRUN=1 bash ~/ols-qa-tc-autodraft-bot/run.sh`

## Auto-flip stories to TESTING

Keeps the Jira board honest against the QA tracking sheet: a **story** sitting at **READY TO TEST** whose
own per-ticket TC tab already has **at least one (≥1)** test case in any status other than `Not Started`
means testing has actually begun, so its Jira status is moved to **TESTING**. The **QA Owner / assignee is
never changed** — ownership is tracked by status, not by assignee.

OLS-specific infrastructure (a launchd bot on the QA Mac), **not** a helix skill. Google Sheets + Jira REST
are both reachable without the NDLP VPN, so this one runs every weekday regardless of VPN state.

- Tool: `~/ols-qa-testing-bot/scan_testing_flip.py` — reads the sheet **Summary** tab → each
  READY-TO-TEST story's own tab, counts `started` (status non-empty and not `Not Started`); `started ≥ 1`
  = flip candidate.
  - `python3 scan_testing_flip.py` → dry-run, report candidates only (no Jira write)
  - `python3 scan_testing_flip.py --apply` → transition each candidate via Jira transition **121 "pick up by
    QA"** (READY TO TEST → TESTING). It re-reads each story's **live** status first and only flips ones still
    at READY TO TEST, and never sends `assignee` → QA Owner stays exactly as-is. **Idempotent** — safe to
    re-run by hand.
- Stories with no per-ticket tab in the sheet are skipped, never flipped.
- Schedule: weekday **10:00 AM & 5:00 PM** via `~/ols-qa-testing-bot/flip_run.sh` (if the Mac is asleep at
  fire time, launchd runs the missed job on next wake). Log: `~/ols-qa-testing-bot/logs/flip.log`.

## Post-run close-out (runs after every AI test run, per story)

Two steps the AI/bot performs to hand a story back to its human QA Owner once the automated cases are done. **The card stays at `TESTING`** — AI only pre-runs; the real QA Owner does the final recheck + closes.

**1. Progress tab — nothing to do (RETIRED 2026-07-24)**
- `sort_test_progress.py` and the whole `progress_closeout.sh` chain are **deprecated** (the sorter now hard-refuses on start); their target tab `Test Progress - ALL TC` was **deleted**. Do not run them.
- The tab is now **`Test Progress - ALL TC - Revised`**, rebuilt atomically from source by the single writer `progress_build.py` (launchd `ols-progress-build`, every 2 min) — it already sorts `% Passed` desc, tie-break ticket number asc. See [docs/progress-tab-single-flow.md](https://github.com/Thitic9203/ols-qa-evidence/blob/main/docs/progress-tab-single-flow.md).
- **No row highlighting.** The AI-row solid-yellow highlight was **removed 2026-07-24** at the user's request; the builder resets the whole data block to white every run. Do not re-add it.

**2. Hand QA Owner back to the real person** — after posting the result comment:
- Revert **QA Owner** from the AI account (`QA Lead`) to the story's **most-recent prior owner** (from the Jira field changelog) in BOTH Jira field **`customfield_12120`** and the sheet (`Summary` col G + `Test Progress` col B).
- Post an AI comment on the story **@mentioning that owner** — "recheck the AI results + test the remaining cases AI couldn't (multi-account / threshold / BPM / missing-fixture / PO-confirm)". Card kept at **TESTING**.
- **QA Owner B resigned → substitute QA Owner A** wherever the prior owner would be QA Owner B; never assign/ping QA Owner B again.
- Assignee is **never** touched (ownership = status + QA Owner field, not assignee).

**Discord destination** — every QA notify/handoff goes **only** to the thread `🏂 ปั่นเทสด้วย AI` (id `<DISCORD_QA_THREAD_ID>`). `discord_qa_notify.py` targets it via `?thread_id=`; ad-hoc sends must include that thread id (or use the bot token to post to the channel directly) — a bare webhook POST lands in the wrong parent channel.

## Background automations (launchd on the QA Mac)

Scheduled jobs that keep the QA pipeline running unattended. All are `launchd` agents on the QA Mac; each
needs the machine awake, and anything that touches OLS also needs the NDLP VPN up (jobs skip quietly
otherwise).

| Job | Schedule | What it does |
|-----|----------|--------------|
| **Testing listener** (`ols-testing-listener`) | ทำงานตลอด (KeepAlive) | Runs the Discord bot: `/bot-testing` on-request **+** the autopoll trigger |
| ↳ Autopoll (inside the listener) | every 2 h | Finds ready tickets → asks in Discord → first click claims + runs on **Yes** (see *Automated testing trigger*) |
| **TC auto-draft** (`ols-tc-autodraft`) | **disabled 2026-07-25** (was every 4 h) | Drafts FE test cases for tickets that have none yet — launchd trigger currently disabled (see *Automated TC auto-draft*) |
| **QA-owner sync** (`ols-qa-owner-sync`) | every 2 min | Keeps the QA Owner shown in already-sent Discord notifications in step with Jira |
| **Test-type deliverable sync** (`ols-tc-result-sync`) | **frozen 2026-08-11** (was every 1 h) | Rebuilds the 3 customer deliverable sheets (System / Integration / Unit test-type) from the QA source sheet — Sheets/Drive API only, no VPN; each tab behind a 5-layer gate, grid-clamped + per-request timeout + per-leg watchdog. Currently frozen; run `/sync-tc-result` to refresh manually (see Changelog) |
| **Auto-flip to TESTING** (`ols-flip-testing`) | Mon–Fri 10 AM & 5 PM | Flips any story at **READY TO TEST** whose sheet TC tab has **≥1 started case** to **TESTING**, QA Owner untouched (see *Auto-flip stories to TESTING*) |
| **Login smoke-test** (`ols-login-check`) | Mon–Fri 10:35 AM | Connects the VPN and checks NDLP→OLS SSO login still works; logs the result |
| **Auth-token check** (`ols-tc-token-check`) | **disabled 2026-07-25** | Kept the headless Claude auth token fresh for the auto-draft bot — disabled together with TC auto-draft |
| **Wake-for-audit** (`wake-for-audit`) | Mon–Fri 10:25 AM | Wakes the Mac ~10 min before the morning jobs so the schedule actually fires |

Separately, a Google Apps Script syncs the tracking sheet's **QA Owner** column from Jira — so ownership set
anywhere (a `/bot-testing` verdict, an autopoll click, a manual Jira edit) shows up in the sheet on its own.

## Changelog

### v1.44.0 — new `/tc-review` skill: review an already-written TC document against a ticket's AC/EC (15 Sep 2026)

No existing skill covered reviewing a TC document someone already wrote — `/tc-fe-prep`/`/tc-api-prep`
author new cases, `/review-result` judges recorded execution evidence. `/tc-review` fills the gap
between them: build a traceability matrix from the ticket's AC/EC and business-rules sub-items, flag
every row-quality defect against `tc-quality-standards.md`, and report Good vs Need Improve with every
finding anchored to a quoted source on both sides — no finding without a quote, the same Iron Law
`catch-ai-workflow` uses. Distinguishes a spec-level gap (missing from the ticket's own AC list) from
an actual TC-document gap, and an unclear/conflicting AC becomes a BLOCKED row with an actionable
Remark, never a guessed finding. Optional external share (Discord/Slack/etc.) never invents a
channel/thread/mention id, and always reads the send back before declaring done.

### v1.36.15 — re-recording a clip the customer already has is its own job, with its own gate (1 Sep 2026)

Redoing delivered evidence kept being treated as a fresh capture, and it is not: the result cell
already says PASSED, a frozen sheet links the file **by id**, and the reason for the redo is usually
that the original never proved its Expected Result. A round spent a whole take discovering that the
number it was filming physically could not move, then nearly spent the retry on fixtures the first
take had already consumed.

`references/qa-evidence-gates.md` now carries an **R1–R6 fail-closed gate** for that job: read the
previous run's own machine-readable result (one had recorded its failed assertion and shipped
anyway), prove the Expected Result is demonstrable in this environment **before** spending a take,
search the team's existing remark and bug rows before theorising, budget fixtures whose
demonstration consumes them, make the recorder assert the outcome from the authoritative source and
exit non-zero when it is false, and replace the delivered file **by file id** then download it again
and compare checksums.

It also names the shape R2 keeps catching — counters that dedupe per caller so a shared egress can
never move them again, writes that answer `204` and change nothing, and per-entity behaviour that
differs between sibling entity types — and states plainly that an Expected Result which is not
demonstrable here is a **BLOCKED with the measurement behind it**, never a shorter clip.

### v1.36.11–v1.36.14 — evidence: every role covered, and the clip measured by an instrument instead of by eye (1 Sep 2026)

A round used to be able to report a story green while its evidence was one clip from whichever account
was logged in, cut off before the value under test was on screen. Four changes close that, and every
number below was measured on real clips rather than chosen.

- **Capture scope is now the ticket's own contract — roles, steps, targets**
  ([references/qa-evidence-gates.md](references/qa-evidence-gates.md)). A role the ticket names is a role
  recorded: 5 roles = **5 capture sets**, canonical ids copy-pasted, and a collective phrase ("ทุก role",
  "all roles") expands to all five. A role you cannot exercise is a **BLOCKED row naming it** — never
  "covered by another role". A role's set covers the ER items *that role's steps decide*, so a
  role-invariant item is captured once with the role stated instead of five times. Every written Test Step
  must be visible on screen (a numbered step can no longer be relabelled a precondition at capture time),
  and the clip must **scroll to the value under verification and hold it in frame long enough to read** —
  stopping the recording before the expected result is on screen leaves that ER uncaptured, whatever the
  flow looked like.
- **Playwright's `recordVideo` is banned for deliverables, with the reasons measured.** Its ffmpeg is
  spawned hardcoded at **1 Mbps VP8** for 1920×1080, so the picture pumps whenever the page moves (mean
  edge energy 1733 static vs 1529 moving, −11.8%; worst frame −37%), and it pads a fixed 40 ms grid by
  repeating the previous frame (**21.2% of a delivered clip's moving frames were repeats**, against the
  ≤ 5% the gate allows). Neither is reachable from its API. Clips now come from a CDP screencast into one
  x264 encode — ack-first, every frame kept at its real timestamp, CRF 18, limited-range `yuv420p`.
- **Two instruments replace eye-judgement, and they run before a clip can be handed over.**
  `verify_video.py` measures resolution/codec/pixel format, steadiness (repeats inside moving stretches,
  declared still-holds excluded and **capped at 25%**), provenance against the recorder's manifest, and
  that the file plays end to end. `verify_shot.py` gives the stills their first floor: a full-viewport
  still is ≥ 1920 px wide, luma must actually vary (the blank frame captured before the page painted used
  to pass an existence check), with `--crop` for a deliberate zoom. The recorder fails closed on a starved
  or truncated capture, so a clip that would judder cannot be produced quietly.
- **A pre-delivery gate now stands between the work and the requester** — scope re-counted from the ticket
  this round (not from the plan written earlier), role × case matrix full, **every** evidence file opened
  and measured rather than counted, every claim pointing at a row, and a four-question adversarial pass
  that names which artifact to open. Unattended runs resolve to BLOCKED rows and report *incomplete*
  rather than emitting nothing. The handover states cases run/total, roles covered/named, files verified,
  and every blocker with its reason.
- **New tooling in the QA bot (off-repo) so the above is mechanical, not remembered:**
  `evidence_plan.py` reads the ticket — including the custom fields OLS bugs actually keep their content
  in — and writes the exact filename of every clip and still required; `preflight_roles.js` proves you can
  *be* each required role before capturing starts (it refuses to pick the environment, and reports the
  account's **real** roles from the auth response rather than the sheet's label); `evidence_reconcile.py`
  diffs plan against reality, opens each file, and exits non-zero when anything is missing.

### v1.34.0 — `/testing-ticket` + `/retest-bug` rebuilt around the customer-escape review: Figma comparison on every UI case, a case list in every retest comment, task retest (18 Aug 2026)

Driven by the root-cause review of **25 defects the customer found after our own run reported the surface
green**. Each gate below maps to a mechanism in that review, not to general good practice.

- **New [references/figma-design-comparison.md](references/figma-design-comparison.md) — a UI case is not
  verified until its screen has been compared with the design.** Five points per screen: elements present ·
  text **char-exact** · order/position · the states the node defines (empty · loading · error · over-limit ·
  disabled) · no overflow/overlap. The **node link actually opened** is recorded on the report's `Design ref:` line — "compared
  against Figma" with no node is not evidence. **No design reference ⇒ report it back to the person or
  channel that assigned the run** (asking for the node, a written visual contract, or an explicit "function
  only"), keep testing everything that does not depend on it, and hold the visual points at **BLOCKED** —
  never an assumed label, never a PASSED. Unattended runs send the same request to the triggering channel
  instead of halting. Also covers the two directions the review found: a screen **this ticket intentionally
  changed** is *design out of date* (name the design owner, ask for the node update in the same ticket), not
  a defect — and an **AC revised mid-test to match the build** must say so in the verdict line
  (`PASSED against AC as revised {date}, differs from design in …`) and go to the known-limitation list.
- **New [references/customer-escape-prevention.md](references/customer-escape-prevention.md) — the depth
  gates, each tied to its escape count.** Cover the **whole surface** a ticket touched, not only its own AC
  lines (a card passed while the bug sat on the detail page reusing it) · expected results must test *right*,
  not *present* — four dimensions, and `complete` / `correct` / `ครบถ้วน` / `ถูกต้อง` are banned as standalone
  expectations · **`caveat` / `not verifiable` / `assumed` / `ยืนยันไม่ได้` in an actual result forbids a
  passing status** (we once shipped exactly that, and it was the customer's bug) · every in-scope width run
  as its own row with overflow/overlap **measured** (`rect.right > innerWidth`, `scrollWidth > innerWidth`,
  >3 px intersection), out-of-scope widths stated out of scope · fixtures big enough to fail · results bound
  to a **build id** with a delta re-run for anything landing after · **evidence on passed rows too**
  (12 of 122 had it) · unspecified behaviour is a question, never a verdict or a bug · session preflight that
  sees the user in the session response before any result is believed.
- **`/retest-bug` now retests a Task/Story as well as a Bug.** A Bug is judged against its Expected Result
  field; a Task against its **Acceptance Criteria** (read where the AC actually lives — usually the
  description) with the same enumerate → row → reconcile discipline. A task stating no verifiable AC is
  BLOCKED with a question to the owner, never a PASSED.
- **Every retest comment now carries a case list.** New **Step 2c** builds it before testing (contract ids +
  the surface's existing cases + states + in-scope widths, each with an id and fixture), and the
  comment posts it as a `Test cases run` table — `Case · Title · Covers · Status` — reconciled
  against the `ER*`/`AC*` ids and the `Case coverage: {n}/{total}` line. It is the artifact that outlives the
  ticket: a result that never became a case row never gets re-run, which is how three of the escapes happened.
- **New gates wired into both workflows:** retest **Step 2d** (design reference gate) and **Step 4i** (design
  comparison + depth sweep, run on PASSED cases too); testing-ticket **Phase B4/B5** (design gate + depth
  scope), **Phase C** confirm block now shows `Design ref` / `Build` / `Widths`, **Phase D** session preflight,
  and new **E0** (design comparison + measured layout checks per scenario). Phase F2 gains a `Width`
  column; the design reference stays on the report header's `Design ref:` line rather than in a per-row
  column. The F4 reader gate and the retest Step 8·0 gate both fail closed on a missing design reference,
  an unmeasured width, a passed row without evidence, or a "cannot verify" row carrying a pass.

### v1.28.6 — `/create-bug` now re-checks the board before filing (a defect already settled in another ticket is not a bug) (9 Aug 2026)

- **New board-conflict gate in `/create-bug` (WORKFLOW Phase B2), run before any draft/confirm.** For every
  candidate bug, the skill searches the tracker/board — summaries **and** comment text, open **and** closed
  tickets — for a prior ticket covering the same screen / field / message / behavior. If a resolved ticket
  records a decision that the current behavior is intended (e.g. a discussion concluded the error text must
  be exactly what the app now shows), that candidate is **not a bug**: it is dropped, and the finding is
  reported to the user in chat **with the reference link** (the concluding comment URL, not just the ticket
  key) so they can verify the reasoning. A duplicate that is still open points at the existing ticket instead
  of filing a second one; an uncertain match becomes a question to the PO, not a bug.
- Wired through the whole skill: the refusal-first precondition gate, the Phase C confirm block (new
  `Board check:` line), the Phase E falsification step, the QA-closing checklist, and a MUST/NEVER row —
  plus a one-line note in the [create-bug SKILL stub](skills/create-bug-workflow/SKILL.md). Complements the
  existing PM-006 "verify the expected/spec against the authoritative source" gate: that stops bugs against
  an *assumed* spec; this stops bugs against a decision the team already *closed*.

### v1.28.5 — new `/test-data-prep` skill with a full ordered Gate 0 intake + strict cover gate (9 Aug 2026)

- **New `/test-data-prep` skill** (OLS-local, not synced to helix) — prepare, seed, or fix OLS test/training
  data (media · course · learning path · cover · video · PDF · account) strictly by
  [`ols-data-prep.md`](https://github.com/Thitic9203/ols-qa-evidence/blob/main/docs/ols-data-prep.md), the
  single source of truth. Nothing is invented; every quality gate is passed before the data is used.
- **Full ordered Gate 0 intake, asked before anything is created** (via `AskUserQuestion`, one step at a
  time, confirmed before Step 1): **0.1** environment + account/role + Confluence URL — dev/pre-prod need
  VPN, **training does not**; **0.2** data type(s) as a checkbox/multi-select + exact target status;
  **0.3** style/format + quantity + purpose; **0.4** conditional details (reuse policy, owner, cover/video
  needed, delivery, lot, clash handling, sample approval).
- **Strict cover gate (7 fail-closed rows)** — title fully inside the frame (no overflow), natural
  line-breaks with whole compound words (no พรากคำ), and max sharpness — all judged against
  `ols-data-prep.md` §5.7.2, plus a STOP red-flags list.

### v1.23.2 — testing + retest workflows now settle-and-strategize first (invoke `engineering:testing-strategy`, no guessing, no loops) (8 Aug 2026)

- **`/testing-ticket` and `/retest-bug` now open with a settle-and-strategize gate before any tool
  call.** Both invoke the **`engineering:testing-strategy`** skill first to plan the approach (what to
  test, order, definition of done, risk), then hold two disciplines the project keeps re-learning:
  **never guess an expected/spec** — the app differing from an *assumed* spec is a question (→ BLOCKED +
  ask PO), not a bug, verify char-exact against Figma/PRD/AC/PO both sides (PM-006); and **no blind
  retry loops** — the same action failing the same way twice = stop and root-cause with
  `superpowers:systematic-debugging`, never a third blind retry.
- New shared fragment [references/settle-and-strategize.md](references/settle-and-strategize.md), linked
  from both the [testing-ticket-workflow](skills/testing-ticket-workflow/SKILL.md) and
  [retest-bug-workflow](skills/retest-bug-workflow/SKILL.md) stubs + their WORKFLOW.md `## Discipline`
  headers (first item, before intake).

---

## ตัวอย่างผลลัพธ์ TC FE Prep

> ตัวอย่างจาก story สมมติ **OLS-142 — Admin อนุมัติหรือปฏิเสธคำขอเข้าร่วมคอร์ส**
> 3 AC/EC → 5 TCs: Unit Test ×1 · Integration Test ×1 · System Test ×3

---

### 💬 เม้นใน Jira

<details>
<summary>คลิกเพื่อดูตัวอย่าง comment ที่โพสต์ใน Jira</summary>

Draft TC FE as below — ดูรายละเอียด Precondition / Steps / Expected ได้ในไฟล์แนบ

**Shared data preparation (all TCs):**

1. เข้าสู่ระบบ OLS Admin Portal ด้วยบทบาท Admin
2. ไปที่เมนู **จัดการคอร์ส** → เลือกคอร์ส **OLS-Demo-Course**
3. เปิดแท็บ **คำขอเข้าร่วม**
4. ตรวจสอบว่ามีคำขอในสถานะ **รอการอนุมัติ** อย่างน้อย 1 รายการ (ถ้าไม่มี: สร้างคำขอใหม่ผ่านบัญชี test.learner01@example.com)
5. ใช้คำขอของ **test.learner01@example.com** เป็นเป้าหมายสำหรับทุกเคสด้านล่าง

| **AC/EC Ref** | **Services Impacted** | **ID** | **Test Title** | **Priority** | **Type** |
| --- | --- | --- | --- | --- | --- |
| EC_01 | Frontend Utils | 1 | validateRejectionReason คืน false เมื่อเหตุผลว่างเปล่า | Low | Unit Test |
| AC_02 | **1.** Enrollment Service **2.** Email Service | 2 | Email แจ้งอนุมัติถูกส่งไปยังผู้เรียน | Medium | Integration Test |
| AC_01 | OLS Portal | 3 | แสดงรายการคำขอรอการอนุมัติ | Medium | System Test |
| AC_02 | **1.** OLS Portal **2.** Enrollment Service | 4 | อนุมัติคำขอเข้าร่วมสำเร็จ | High | System Test |
| EC_01 | OLS Portal | 5 | ป้องกันปฏิเสธโดยไม่มีเหตุผล | High | System Test |

**Remark — Type coverage:**
- มี *Unit Test* 1 เคส (TC 1)
- มี *Integration Test* 1 เคส (TC 2)
- มี *System Test* 3 เคส (TC 3–5)

📎 **Attachments:**
- [Draft\_Jira\_OLS-142.csv](https://<ORG>.atlassian.net/secure/attachment/11001/Draft_Jira_OLS-142.csv)
- [Import\_Qase\_OLS-142.csv](https://<ORG>.atlassian.net/secure/attachment/11002/Import_Qase_OLS-142.csv)
- [Unit\_Test\_OLS-142.csv](https://<ORG>.atlassian.net/secure/attachment/11005/Unit_Test_OLS-142.csv)
- [Integration\_Test\_OLS-142.csv](https://<ORG>.atlassian.net/secure/attachment/11004/Integration_Test_OLS-142.csv)
- [System\_Test\_OLS-142.csv](https://<ORG>.atlassian.net/secure/attachment/11003/System_Test_OLS-142.csv)

⚠️ Disclaimer: ข้อมูลนี้เป็นเพียง Draft Version ที่ได้จากการใช้ Skill เท่านั้น (TC ครบตาม AC & EC) เนื้อหาทั้งหมดจำเป็นต้องได้รับการรีวิวและอัปเดตโดยทีม QA ก่อนนำไปใส่ในไฟล์เอกสารส่งมอบ และทำการนำ TC ไป Import เข้าสู่ Qase.io

</details>

---

### 📎 Attachments (CSV)

> ไฟล์ CSV เป็น standalone — คอลัมน์ Precondition จึงรวม shared data preparation ทุกขั้นตอนไว้ในตารางโดยตรง ไม่มี section แยกด้านบน

<details>
<summary>Draft_Jira_OLS-142.csv — ตาราง 10 คอลัมน์สำหรับ Jira (ทุกประเภท รวม 5 TC, เรียง Unit → Integration → System)</summary>

| Acceptance Criteria | Services Impacted | TC ID | Test Title | Precondition | Test Data | Test Steps | Expected Result | Priority | Type |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| EC_01: ปฏิเสธโดยไม่ระบุเหตุผล → ระบบแสดง error ห้ามบันทึก | Frontend Utils | 1 | validateRejectionReason คืน false เมื่อเหตุผลว่างเปล่า | 1. เข้าสู่ระบบ OLS Admin Portal ด้วยบทบาท Admin<br>2. ไปที่เมนู จัดการคอร์ส → เลือกคอร์ส OLS-Demo-Course<br>3. เปิดแท็บ คำขอเข้าร่วม<br>4. ตรวจสอบว่ามีคำขอสถานะ รอการอนุมัติ อย่างน้อย 1 รายการ<br>5. ใช้คำขอของ test.learner01@example.com เป็นเป้าหมาย | reason: (ว่าง) | 1. เรียก validateRejectionReason โดยส่งค่า reason ว่าง | 1. ฟังก์ชันคืนค่า false<br>2. ไม่มี network request ถูกส่ง | Low | Unit Test |
| AC_02: Admin อนุมัติคำขอ → สถานะอัปเดต + ส่ง email แจ้งผู้เรียน | 1. Enrollment Service<br>2. Email Service | 2 | Email แจ้งอนุมัติถูกส่งไปยังผู้เรียน | 1. เข้าสู่ระบบ OLS Admin Portal ด้วยบทบาท Admin<br>2. ไปที่เมนู จัดการคอร์ส → เลือกคอร์ส OLS-Demo-Course<br>3. เปิดแท็บ คำขอเข้าร่วม<br>4. ตรวจสอบว่ามีคำขอสถานะ รอการอนุมัติ อย่างน้อย 1 รายการ<br>5. ใช้คำขอของ test.learner01@example.com เป็นเป้าหมาย<br>6. เปิด inbox ของ test.learner01@example.com ในแท็บอื่น | Email: test.learner01@example.com | 1. Admin อนุมัติคำขอตาม TC 4<br>2. ตรวจสอบ inbox ของ test.learner01 | 1. ได้รับ email หัวข้อ "คำขอของคุณได้รับการอนุมัติ"<br>2. email มีชื่อคอร์สและลิงก์เข้าเรียน | Medium | Integration Test |
| AC_01: Admin เห็นรายการคำขอที่รอการอนุมัติ | OLS Portal | 3 | แสดงรายการคำขอรอการอนุมัติ | 1. เข้าสู่ระบบ OLS Admin Portal ด้วยบทบาท Admin<br>2. ไปที่เมนู จัดการคอร์ส → เลือกคอร์ส OLS-Demo-Course<br>3. เปิดแท็บ คำขอเข้าร่วม<br>4. ตรวจสอบว่ามีคำขอสถานะ รอการอนุมัติ อย่างน้อย 1 รายการ<br>5. ใช้คำขอของ test.learner01@example.com เป็นเป้าหมาย | - | 1. ไปที่แท็บ คำขอเข้าร่วม | 1. รายการคำขอแสดงผล<br>2. เห็นคอลัมน์ ชื่อ / วันที่ / สถานะ ครบ | Medium | System Test |
| AC_02: Admin อนุมัติคำขอ → สถานะอัปเดต + ส่ง email แจ้งผู้เรียน | 1. OLS Portal<br>2. Enrollment Service | 4 | อนุมัติคำขอเข้าร่วมสำเร็จ | 1. เข้าสู่ระบบ OLS Admin Portal ด้วยบทบาท Admin<br>2. ไปที่เมนู จัดการคอร์ส → เลือกคอร์ส OLS-Demo-Course<br>3. เปิดแท็บ คำขอเข้าร่วม<br>4. ตรวจสอบว่ามีคำขอสถานะ รอการอนุมัติ อย่างน้อย 1 รายการ<br>5. ใช้คำขอของ test.learner01@example.com เป็นเป้าหมาย<br>6. คำขอของ test.learner01 อยู่ในสถานะ รอการอนุมัติ | คำขอของ test.learner01@example.com | 1. คลิก อนุมัติ ที่แถว test.learner01<br>2. ยืนยันใน modal | 1. สถานะเปลี่ยนเป็น อนุมัติแล้ว<br>2. แถวหายจากรายการ รอการอนุมัติ | High | System Test |
| EC_01: ปฏิเสธโดยไม่ระบุเหตุผล → ระบบแสดง error ห้ามบันทึก | OLS Portal | 5 | ป้องกันปฏิเสธโดยไม่มีเหตุผล | 1. เข้าสู่ระบบ OLS Admin Portal ด้วยบทบาท Admin<br>2. ไปที่เมนู จัดการคอร์ส → เลือกคอร์ส OLS-Demo-Course<br>3. เปิดแท็บ คำขอเข้าร่วม<br>4. ตรวจสอบว่ามีคำขอสถานะ รอการอนุมัติ อย่างน้อย 1 รายการ<br>5. ใช้คำขอของ test.learner01@example.com เป็นเป้าหมาย<br>6. modal ปฏิเสธเปิดอยู่ | ช่องเหตุผล: (ว่าง) | 1. คลิก ปฏิเสธ<br>2. ไม่กรอกเหตุผลใน modal<br>3. คลิก บันทึก | 1. ระบบแสดง error "กรุณาระบุเหตุผล"<br>2. modal ยังคงเปิดอยู่<br>3. สถานะคำขอไม่เปลี่ยน | High | System Test |

</details>

<details>
<summary>Import_Qase_OLS-142.csv — สำหรับนำเข้า Qase.io (เรียง Unit → Integration → System)</summary>

| AC/EC | Title | Preconditions | Priority | Type | Status | Suite | Steps – Action | Steps – Expected | Steps – Data | Tags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| EC_01 — ปฏิเสธโดยไม่ระบุเหตุผล → ระบบแสดง error ห้ามบันทึก | validateRejectionReason คืน false เมื่อเหตุผลว่างเปล่า | 1. เข้าสู่ระบบ OLS Admin Portal ด้วยบทบาท Admin<br>2. ไปที่เมนู จัดการคอร์ส → เลือกคอร์ส OLS-Demo-Course<br>3. เปิดแท็บ คำขอเข้าร่วม<br>4. ตรวจสอบว่ามีคำขอสถานะ รอการอนุมัติ อย่างน้อย 1 รายการ<br>5. ใช้คำขอของ test.learner01@example.com เป็นเป้าหมาย | Low | Unit Test | Done | Course Management > Enrollment Requests | 1. เรียก validateRejectionReason โดยส่งค่า reason ว่าง | 1. ฟังก์ชันคืนค่า false<br>2. ไม่มี network request ถูกส่ง | reason: (ว่าง) | EC_01, ปฏิเสธโดยไม่ระบุเหตุผล → ระบบแสดง error ห้ามบันทึก |
| AC_02 — Admin อนุมัติคำขอ → สถานะอัปเดต + ส่ง email แจ้งผู้เรียน | Email แจ้งอนุมัติถูกส่งไปยังผู้เรียน | 1. เข้าสู่ระบบ OLS Admin Portal ด้วยบทบาท Admin<br>2. ไปที่เมนู จัดการคอร์ส → เลือกคอร์ส OLS-Demo-Course<br>3. เปิดแท็บ คำขอเข้าร่วม<br>4. ตรวจสอบว่ามีคำขอสถานะ รอการอนุมัติ อย่างน้อย 1 รายการ<br>5. ใช้คำขอของ test.learner01@example.com เป็นเป้าหมาย<br>6. เปิด inbox ของ test.learner01@example.com ในแท็บอื่น | Medium | Integration Test | Done | Course Management > Enrollment Requests | 1. Admin อนุมัติคำขอตาม TC 4<br>2. ตรวจสอบ inbox ของ test.learner01 | 1. ได้รับ email หัวข้อ "คำขอของคุณได้รับการอนุมัติ"<br>2. email มีชื่อคอร์สและลิงก์เข้าเรียน | Email: test.learner01@example.com | AC_02, Admin อนุมัติคำขอ → สถานะอัปเดต + ส่ง email แจ้งผู้เรียน |
| AC_01 — Admin เห็นรายการคำขอที่รอการอนุมัติ | แสดงรายการคำขอรอการอนุมัติ | 1. เข้าสู่ระบบ OLS Admin Portal ด้วยบทบาท Admin<br>2. ไปที่เมนู จัดการคอร์ส → เลือกคอร์ส OLS-Demo-Course<br>3. เปิดแท็บ คำขอเข้าร่วม<br>4. ตรวจสอบว่ามีคำขอสถานะ รอการอนุมัติ อย่างน้อย 1 รายการ<br>5. ใช้คำขอของ test.learner01@example.com เป็นเป้าหมาย | Medium | System Test | Done | Course Management > Enrollment Requests | 1. ไปที่แท็บ คำขอเข้าร่วม | 1. รายการคำขอแสดงผล<br>2. เห็นคอลัมน์ ชื่อ / วันที่ / สถานะ ครบ | - | AC_01, Admin เห็นรายการคำขอที่รอการอนุมัติ |
| AC_02 — Admin อนุมัติคำขอ → สถานะอัปเดต + ส่ง email แจ้งผู้เรียน | อนุมัติคำขอเข้าร่วมสำเร็จ | 1. เข้าสู่ระบบ OLS Admin Portal ด้วยบทบาท Admin<br>2. ไปที่เมนู จัดการคอร์ส → เลือกคอร์ส OLS-Demo-Course<br>3. เปิดแท็บ คำขอเข้าร่วม<br>4. ตรวจสอบว่ามีคำขอสถานะ รอการอนุมัติ อย่างน้อย 1 รายการ<br>5. ใช้คำขอของ test.learner01@example.com เป็นเป้าหมาย<br>6. คำขอของ test.learner01 อยู่ในสถานะ รอการอนุมัติ | High | System Test | Done | Course Management > Enrollment Requests | 1. คลิก อนุมัติ ที่แถว test.learner01<br>2. ยืนยันใน modal | 1. สถานะเปลี่ยนเป็น อนุมัติแล้ว<br>2. แถวหายจากรายการ รอการอนุมัติ | คำขอของ test.learner01@example.com | AC_02, Admin อนุมัติคำขอ → สถานะอัปเดต + ส่ง email แจ้งผู้เรียน |
| EC_01 — ปฏิเสธโดยไม่ระบุเหตุผล → ระบบแสดง error ห้ามบันทึก | ป้องกันปฏิเสธโดยไม่มีเหตุผล | 1. เข้าสู่ระบบ OLS Admin Portal ด้วยบทบาท Admin<br>2. ไปที่เมนู จัดการคอร์ส → เลือกคอร์ส OLS-Demo-Course<br>3. เปิดแท็บ คำขอเข้าร่วม<br>4. ตรวจสอบว่ามีคำขอสถานะ รอการอนุมัติ อย่างน้อย 1 รายการ<br>5. ใช้คำขอของ test.learner01@example.com เป็นเป้าหมาย<br>6. modal ปฏิเสธเปิดอยู่ | High | System Test | Done | Course Management > Enrollment Requests | 1. คลิก ปฏิเสธ<br>2. ไม่กรอกเหตุผลใน modal<br>3. คลิก บันทึก | 1. ระบบแสดง error "กรุณาระบุเหตุผล"<br>2. modal ยังคงเปิดอยู่<br>3. สถานะคำขอไม่เปลี่ยน | ช่องเหตุผล: (ว่าง) | EC_01, ปฏิเสธโดยไม่ระบุเหตุผล → ระบบแสดง error ห้ามบันทึก |

</details>

<details>
<summary>Unit_Test_OLS-142.csv — Unit Test 1 TC (TC 1)</summary>

| Acceptance Criteria | Services Impacted | TC ID | Test Title | Precondition | Test Data | Test Steps | Expected Result | Priority | Type |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| EC_01: ปฏิเสธโดยไม่ระบุเหตุผล → ระบบแสดง error ห้ามบันทึก | Frontend Utils | 1 | validateRejectionReason คืน false เมื่อเหตุผลว่างเปล่า | 1. เข้าสู่ระบบ OLS Admin Portal ด้วยบทบาท Admin<br>2. ไปที่เมนู จัดการคอร์ส → เลือกคอร์ส OLS-Demo-Course<br>3. เปิดแท็บ คำขอเข้าร่วม<br>4. ตรวจสอบว่ามีคำขอสถานะ รอการอนุมัติ อย่างน้อย 1 รายการ<br>5. ใช้คำขอของ test.learner01@example.com เป็นเป้าหมาย | reason: (ว่าง) | 1. เรียก validateRejectionReason โดยส่งค่า reason ว่าง | 1. ฟังก์ชันคืนค่า false<br>2. ไม่มี network request ถูกส่ง | Low | Unit Test |

</details>

<details>
<summary>Integration_Test_OLS-142.csv — Integration Test 1 TC (TC 2)</summary>

| Acceptance Criteria | Services Impacted | TC ID | Test Title | Precondition | Test Data | Test Steps | Expected Result | Priority | Type |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AC_02: Admin อนุมัติคำขอ → สถานะอัปเดต + ส่ง email แจ้งผู้เรียน | 1. Enrollment Service<br>2. Email Service | 2 | Email แจ้งอนุมัติถูกส่งไปยังผู้เรียน | 1. เข้าสู่ระบบ OLS Admin Portal ด้วยบทบาท Admin<br>2. ไปที่เมนู จัดการคอร์ส → เลือกคอร์ส OLS-Demo-Course<br>3. เปิดแท็บ คำขอเข้าร่วม<br>4. ตรวจสอบว่ามีคำขอสถานะ รอการอนุมัติ อย่างน้อย 1 รายการ<br>5. ใช้คำขอของ test.learner01@example.com เป็นเป้าหมาย<br>6. เปิด inbox ของ test.learner01@example.com ในแท็บอื่น | Email: test.learner01@example.com | 1. Admin อนุมัติคำขอตาม TC 4<br>2. ตรวจสอบ inbox ของ test.learner01 | 1. ได้รับ email หัวข้อ "คำขอของคุณได้รับการอนุมัติ"<br>2. email มีชื่อคอร์สและลิงก์เข้าเรียน | Medium | Integration Test |

</details>

<details>
<summary>System_Test_OLS-142.csv — System Test 3 TC (TC 3–5)</summary>

| Acceptance Criteria | Services Impacted | TC ID | Test Title | Precondition | Test Data | Test Steps | Expected Result | Priority | Type |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AC_01: Admin เห็นรายการคำขอที่รอการอนุมัติ | OLS Portal | 3 | แสดงรายการคำขอรอการอนุมัติ | 1. เข้าสู่ระบบ OLS Admin Portal ด้วยบทบาท Admin<br>2. ไปที่เมนู จัดการคอร์ส → เลือกคอร์ส OLS-Demo-Course<br>3. เปิดแท็บ คำขอเข้าร่วม<br>4. ตรวจสอบว่ามีคำขอสถานะ รอการอนุมัติ อย่างน้อย 1 รายการ<br>5. ใช้คำขอของ test.learner01@example.com เป็นเป้าหมาย | - | 1. ไปที่แท็บ คำขอเข้าร่วม | 1. รายการคำขอแสดงผล<br>2. เห็นคอลัมน์ ชื่อ / วันที่ / สถานะ ครบ | Medium | System Test |
| AC_02: Admin อนุมัติคำขอ → สถานะอัปเดต + ส่ง email แจ้งผู้เรียน | 1. OLS Portal<br>2. Enrollment Service | 4 | อนุมัติคำขอเข้าร่วมสำเร็จ | 1. เข้าสู่ระบบ OLS Admin Portal ด้วยบทบาท Admin<br>2. ไปที่เมนู จัดการคอร์ส → เลือกคอร์ส OLS-Demo-Course<br>3. เปิดแท็บ คำขอเข้าร่วม<br>4. ตรวจสอบว่ามีคำขอสถานะ รอการอนุมัติ อย่างน้อย 1 รายการ<br>5. ใช้คำขอของ test.learner01@example.com เป็นเป้าหมาย<br>6. คำขอของ test.learner01 อยู่ในสถานะ รอการอนุมัติ | คำขอของ test.learner01@example.com | 1. คลิก อนุมัติ ที่แถว test.learner01<br>2. ยืนยันใน modal | 1. สถานะเปลี่ยนเป็น อนุมัติแล้ว<br>2. แถวหายจากรายการ รอการอนุมัติ | High | System Test |
| EC_01: ปฏิเสธโดยไม่ระบุเหตุผล → ระบบแสดง error ห้ามบันทึก | OLS Portal | 5 | ป้องกันปฏิเสธโดยไม่มีเหตุผล | 1. เข้าสู่ระบบ OLS Admin Portal ด้วยบทบาท Admin<br>2. ไปที่เมนู จัดการคอร์ส → เลือกคอร์ส OLS-Demo-Course<br>3. เปิดแท็บ คำขอเข้าร่วม<br>4. ตรวจสอบว่ามีคำขอสถานะ รอการอนุมัติ อย่างน้อย 1 รายการ<br>5. ใช้คำขอของ test.learner01@example.com เป็นเป้าหมาย<br>6. modal ปฏิเสธเปิดอยู่ | ช่องเหตุผล: (ว่าง) | 1. คลิก ปฏิเสธ<br>2. ไม่กรอกเหตุผลใน modal<br>3. คลิก บันทึก | 1. ระบบแสดง error "กรุณาระบุเหตุผล"<br>2. modal ยังคงเปิดอยู่<br>3. สถานะคำขอไม่เปลี่ยน | High | System Test |

</details>
