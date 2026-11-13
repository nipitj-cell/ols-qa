# Testing ticket workflow

> Not a skill entry — the skill name, description and triggers live only in [SKILL.md](../../testing-ticket-workflow/SKILL.md).

Run **Playwright-based** testing for a **single ticket** after intake (the intake summary and plan are shown, and the run starts only after the user confirms them). **Self-contained in Helix** — do not invoke `full-test-plugin`.

**This workflow does not open bug reports.** If the user wants bugs filed → route to **`create-bug-workflow`** (`/helix` → Create bug).

## Contents

- [Progress checklist](#progress-checklist)
- [Discipline](#discipline)
- [Refusal-first (precondition gate)](#refusal-first-precondition-gate)
- [Core constraints](#core-constraints)
- [Phase A — Session intake (mandatory) \[medium freedom\]](#phase-a--session-intake-mandatory-medium-freedom)
- [Phase B — Load context \[high freedom\]](#phase-b--load-context-high-freedom)
- [Phase C — Show the plan, wait for confirmation \[medium freedom\]](#phase-c--show-the-plan-wait-for-confirmation-medium-freedom)
- [Phase D — Pre-flight (mandatory) \[low freedom\]](#phase-d--pre-flight-mandatory-low-freedom)
- [Phase E — Execute tests (Playwright) \[low freedom\]](execute-and-summarize.md#phase-e--execute-tests-playwright-low-freedom) — file opened at Phase E
- [Result quality gate (mandatory before Phase F) \[low freedom\]](execute-and-summarize.md#result-quality-gate-mandatory-before-phase-f-low-freedom) — at Phase E end
- [Phase F — Summarize in this chat (mandatory) \[high freedom\]](execute-and-summarize.md#phase-f--summarize-in-this-chat-mandatory-high-freedom) — at Phase F
- [Phase G — Optional: update results elsewhere \[low freedom\]](results-update.md#phase-g--optional-update-results-elsewhere-low-freedom) — file opened at Phase G
- [Phase H — A question arrives after results were published \[low freedom\]](#phase-h--a-question-arrives-after-results-were-published-low-freedom)
- [QA closing (mandatory before session end) \[low freedom\]](#qa-closing-mandatory-before-session-end-low-freedom)
- [Out of scope](#out-of-scope)
- [Next workflows](#next-workflows)
- [References](#references)
- [MUST / NEVER](#must--never)

## Progress checklist

Copy this block when the run starts; tick each line as it completes. A failed gate's **Go back:**
line names the step to untick from.

```text
Testing ticket progress:
- [ ] Refusal-first — required intake fields answered (before Phase B)
- [ ] Phase A — Session intake (mandatory) — open references/session-intake.md, workspace-guide-discovery.md, intake-one-pager.md
- [ ] Phase B — Load context — step 4 figma-design-comparison.md, step 5 customer-escape-prevention.md, step 7 parallel-test-lanes.md §2
- [ ] Login smoke gate — in-scope roles log in (Refusal-first; after Phase B)
- [ ] Phase C — Show the plan, wait for confirmation
- [ ] Phase D — Pre-flight (mandatory) — playwright-preflight.md; dead session → parallel-test-lanes.md §3
- [ ] Phase E — Execute tests (Playwright) — open execute-and-summarize.md (E2 root-cause-investigation.md, E3 non-pass-challenge-gate.md)
- [ ] Result quality gate (mandatory before Phase F) — result-quality-gate.md (in execute-and-summarize.md)
- [ ] Phase F — Summarize in this chat (mandatory) — execute-and-summarize.md Phase F; defects → defect-candidates.md
- [ ] Phase G — Optional: update results elsewhere — open results-update.md + references/result-update-discipline.md
- [ ] QA closing (mandatory before session end) — qa-closing-shared.md
- [ ] Phase H — only if a question arrives after results were published (event-driven)
```

**Run order before Phase C** (one list, so nothing runs out of order):

1. Session start — the context skills in [session-start-context.md](../../../references/session-start-context.md).
2. Settle and strategize (*Discipline* below) — before any other tool call after step 1.
3. The SKILL.md *Dependencies* check.
4. First reply: recite the core constraints, locate the workspace guide, show the intake one-pager (*Core constraints*).
5. Phase A — intake; 🔴 GATE: wait for the required fields.
6. Phase B — load context and build the scenarios; the scenarios decide which roles are in scope.
7. Login smoke gate for those roles only (*Refusal-first*); 🛑 stop on a failing role.
8. Phase C — show the intake summary + plan (with the smoke table); 🔴 GATE: wait for the user's confirmation.
9. Phase D — preflight (re-uses the smoke result; checks each lane's session right before its first scenario).

## Discipline

**Settle and strategize** at *Run order* step 2 — follow
[settle-and-strategize.md](../../../references/settle-and-strategize.md): invoke
**`engineering:testing-strategy`** to plan the approach, then hold to the discipline it names —
no guessing an expected/spec, and no blind retry loops (a repeat failure = stop and diagnose).

Follow [shared-preamble.md](../../../references/shared-preamble.md).

**Round-time contract.** A round has a cap of **15 minutes of AGENT + EXEC** time; human wait is not
counted and is reported on its own line. The cap is soft — print the ~12-minute line, finish the round,
never cut cases. The 15 minutes is a measured reporting line, not a target to meet: no gate, evidence item or
case below is trimmed, batched away or skipped to stay under it; time over it is reported as `overrun`. The Phase F report ends with the `Round time:` line. Full rules:
[round-time-contract.md §1](../../../references/round-time-contract.md).

**Gates:**

- 🔴 GATE (Phase C): confirm before the first Playwright run — the full rule, including the bot-run
  branch, is at **Phase C**.
- 🔴 GATE (end of round): nothing is written outside the run (Jira comment, results destination, notify)
  until the **single end-of-round approval popup** ([§3](../../../references/round-time-contract.md)) —
  because writes are costly to undo. An action the owner delegated by name skips only the wait
  ([no-wait-decision-gate.md](../../../references/no-wait-decision-gate.md) layer 19).
- Credentials are session-only.

**Test through the real steps** — at Phase E *Real surface* ([execute-and-summarize.md](execute-and-summarize.md#phase-e--execute-tests-playwright-low-freedom); [test-through-real-steps.md](../../../references/test-through-real-steps.md)).

**Every FAILED or BLOCKED scenario** is governed by [defect-report-completeness.md](../../../references/defect-report-completeness.md) — the write-up must answer the reader's five questions (what, **which entry points**, what it should be instead, why that is a fail, **what changes and who decides**) before it leaves this workflow. A question asked afterwards means a section was missing;
the fix is the write-up, not a chat reply.

**Root cause is mandatory, never inferred** — every FAILED or BLOCKED scenario; opened at Phase E, run at **E2** ([execute-and-summarize.md](execute-and-summarize.md#e2--root-cause-investigation-mandatory-for-every-failed-and-blocked-scenario-during-the-run)).

**Challenge every non-PASS before you record it (the "wait, really?" gate)** — opened at Phase E, run at **E3** ([execute-and-summarize.md](execute-and-summarize.md#e3--challenge-the-non-pass--queue-it-for-the-user-mandatory-for-every-non-passed-scenario)).

**Test every AC/EC — a hard, fail-closed gate** (the 7-layer coverage gate in [qa-evidence-coverage.md](../../../references/qa-evidence-coverage.md#acec--bug-detail-coverage--7-layer-completeness-defense-gate-mandatory-fail-closed)), opened at Phase E; layers run at: layers 1–2 at **Phase B step 3** · layers 3–5 in **Phase E** ([execute-and-summarize.md](execute-and-summarize.md), *Cover every enumerated AC/EC id*) · layers 6–7 in **Phase F** (*AC/EC coverage reconciliation*) before Phase G.

**Compare against the design (Figma) on every UI scenario — no design, no verdict** ([figma-design-comparison.md](../../../references/figma-design-comparison.md)), run at: does a reference exist at **Phase B step 4** · the comparison itself at **E0**.

**Test deeply — the gates a shipped-defect review put in writing** ([customer-escape-prevention.md](../../../references/customer-escape-prevention.md) §1–§9), each run at: plan at **Phase B step 5** · session at **Phase D** *Session preflight* · checks at **E0** · reconciliation at **Phase F** (*Design + depth reconciliation*).

**Long sessions:** keep a todo list whenever a trigger in [long-workflow-todos.md](../../../references/long-workflow-todos.md) *When to create todos* applies — a full run always meets the first trigger.

## Refusal-first (precondition gate)

MUST refuse to reach Phase B until every required intake field — **Ticket**, **URL**, **User** (or `guest`) and **VPN** — is answered (the Phase A gate) — because without them the test plan has no target, no login and no route to the app.

**Pre-flight login smoke gate (mandatory — after Phase B has built the scenarios, before the Phase C plan is shown; *Run order* step 7).** Before running any scenario, verify that login **actually succeeds** for **only the role(s)/credential set(s) this run's scenarios will actually use** — not every role the project has. Read the run's scenarios to determine which roles are in scope; a
single-role run logs in that one role, a multi-role run logs in each role it uses, nothing more. Reuse the saved login file per role first ([round-time-contract.md §5](../../../references/round-time-contract.md)); when the file is missing or fails the session check, restore it by ready-to-run command (*Fresh login* below), never by opening a login window, and confirm an authenticated
signal (redirect to an authed area, a session/`me` endpoint, or a logged-in UI marker). Produce a pass/fail table for the in-scope roles.
- **All in-scope roles pass →** proceed to Phase C; the pass/fail table is shown in the Phase C plan.
- **Any in-scope role fails →** 🛑 GATE: stop, report which role failed and why (backend error, VPN, bad creds), and do **not** start testing until it is cleared or the user explicitly says to skip the failing role. Never mark scenarios PASSED when auth was never verified.

This catches an auth-backend outage (e.g. an IdP returning a 4xx on every login) up front, before opening cases that would all block later — scoped to the roles the run needs, so an unrelated role's outage never blocks a run that doesn't use it. Project-specific role list, accounts, and login steps live in the project's `references/*-guide.md` / login runbook.

If **VPN** is required per user and environment is unreachable in Phase D, stop and report — do not mark scenarios PASSED without evidence.

---

## Core constraints

Recite once at the start of Phase A (first response only) from [helix-session-constraints.md](../../../references/helix-session-constraints.md) — **All Helix workflows** block, then the **Testing ticket** block.

At Phase A, follow [workspace-guide-discovery.md](../../../references/workspace-guide-discovery.md) for **Testing ticket** and show [intake-one-pager.md](../../../references/intake-one-pager.md) (Testing ticket section).

---

## Phase A — Session intake (mandatory) [medium freedom]

Collect these **six** items. Ask every missing field in **one** message; fields already given (first message or one-pager) are marked done and not asked again:

| Field | Required | What to collect |
|-------|----------|-----------------|
| **Ticket** | Yes | Jira key or browse URL |
| **URL** | Yes | Application under test |
| **User** | Yes* | Test account — username/email only (*`guest` if no login). No password — login by command (Phase D *Fresh login*). Also record the relink/mint command templates when the project guide names none |
| **VPN** | Yes | `Required` / `Not required` + note |
| **Confluence** | No | Page URL or `none` |
| **Swagger** | No | OpenAPI URL or `none` |

🔴 GATE: **wait** until the required fields are answered before Phase B.

**Platform.** Android SuperApp tickets (a web app inside a native app on an emulator) add intake fields — device by AVD name, app build, evidence destination, duplicates policy — asked in this same message; details in the branch reference (see also [android-superapp-branch.md](references/android-superapp-branch.md)). Every other platform keeps the web path below unchanged.

**Workspace-guide values are not asked again** ([round-time-contract.md §2](../../../references/round-time-contract.md)). Environment, account pool, auth directory, Jira post format, results destination and similar per-project values are read from the workspace guide. A value that is missing is asked **once** and **saved to the guide immediately** — no second "save this?" question
([workspace-guide-discovery.md](../../../references/workspace-guide-discovery.md)). Never store production passwords in a committed guide.

**Environment + account are a hard intake item — always settle them, never assume.** Settle both *which environment* and *which account/role* this run uses before any login or Playwright. If neither the user nor the guide has stated them, ask (one grouped message) and wait — never pick an environment yourself, even if one is more convenient. If they were **already** given (earlier this
session, the one-pager, or the project guide), do **not** re-ask: state the values back in chat (`environment=<X> · account=<role/user>`) and continue; they appear again in the Phase C summary, where a correction is made before the run starts.

**Fingerprint check at round start** ([round-time-contract.md §10](../../../references/round-time-contract.md)).
If `references/helix-handoff-{KEY}.md` exists, fetch each fingerprint fresh (ticket `updated` + comment
count · Figma `lastModified` · Swagger spec hash · build version where exposed). A matching source is not
re-read in full; a changed or missing fingerprint re-reads that source only.

**Account pool.** Execution runs in parallel lanes by default ([parallel-test-lanes.md](../../../references/parallel-test-lanes.md)), one account per lane. Read every test account the project guide lists for the environment (role + shared constraints: one OTP inbox, single-session app, rate limit). Lane count = min(units, accounts leasable without collision) — **no fixed lane cap** for
this flow ([round-time-contract.md §4](../../../references/round-time-contract.md)). If the guide lists only the one account the user gave, the lane plan says so — ask for more accounts only when it would change the lane count.

---

## Phase B — Load context [high freedom]

Use [parallel-prep.md](../../../references/parallel-prep.md) when Jira fetch and Confluence/Swagger are independent.

1. Fetch **Ticket** (Jira or user paste).
   - **Fetch fails** (MCP error, 401/403/404, timeout): try the Jira REST fallback in
     [dependencies.md](../../../references/dependencies.md) once. Still failing → tell the user what
     failed (the error line) and ask them to paste the ticket (description, AC/EC, comments). Never
     plan from the ticket title or summary alone; Phase B waits for the paste.
2. **Confluence** / **Swagger** if provided.
3. **Enumerate the AC/EC contract (coverage gate layers 1–2).**
   - **No AC/EC lines on the ticket** (or they live only in comments or attachments): read the description, every comment, the attachments, and the linked parent/epic, and enumerate whatever AC/EC text those hold, citing where each line came from. Still none → report it to the person or channel that assigned the run (ticket · where you looked · what is needed), plan the function-only
     scenarios the ticket text supports and mark them **BLOCKED — no confirmed spec**, and put the question in the Phase C summary (and the end decisions popup if it is still open). Never invent an expected to fill the gap; the coverage gate then reconciles against the enumerated list, which can be empty.

   Before writing the plan, extract **every** Acceptance Criteria and Expected Condition / Expected Result line **char-exact** and give each a stable id (`AC1…`, `EC1…`). Then build the numbered **test plan** so **every id maps to ≥1 scenario** — record the coverage matrix (`AC/EC id → scenario #`). A compound AC ("does A **and** B") splits into one scenario per clause; an id with no
   scenario is a coverage gap → add it, never drop it. (in-scope, out-of-scope, API vs UI.)
4. **Design reference gate (mandatory — every UI scenario).** At Phase B step 4, follow [figma-design-comparison.md](../../../references/figma-design-comparison.md) §1–§2 and §4.
   - **4a Collect and open.** Collect the Figma node for **every screen in scope** (from the ticket, its parent, or the project guide), record the links in the plan, and open each one by [figma-design-comparison.md §2](../../../references/figma-design-comparison.md#2-opening-the-design-both-paths-in-order) (Dev Mode MCP first, then the browser fallback).
   - **4b No node.** Before declaring a screen has no design node, try every route in [no-wait-decision-gate.md](../../../references/no-wait-decision-gate.md) layer 7 (design-tool API with the configured token, browser view, exported image).
     **A screen with no design node → report it back to the person or channel that assigned this run** (ticket · screen · where you looked · what you need: the node link, a written visual contract, or an explicit "function only").
     Keep testing everything that does not depend on the design; the visual points stay **BLOCKED** with a remark naming who was asked. Never assume a label, order, or layout. Unattended/bot mode: same request to the triggering channel with the project's @mention, visual points BLOCKED + remark, run continues.
   - **4c Output.** The node link(s) per screen go on the plan's `Design ref` line.
5. **Scope the depth in the plan** ([customer-escape-prevention.md](../../../references/customer-escape-prevention.md)): name the **surface(s)** in scope and pull in the surface's existing cases — not only this ticket's AC lines (§1)
   · list the **screen widths in scope** (one row per scenario x width in the plan — lists, redirects, toasts included; never drop a width as width-independent) and state which are explicitly out of scope (§4) · list the **states** each screen must be seen in (empty · loading ·
   error · over-limit · disabled) · name the **fixture** each scenario needs and confirm it is big enough to fail — long titles, lists past their visible slots, populated accounts (§5) · record the **build/commit id** under test (§6).
6. Fill [test-execution-plan-template.md](../../../references/test-execution-plan-template.md) in chat (environment, auth, in-scope table, pass criteria, risks). Include the **AC/EC → scenario coverage matrix** so the Phase C plan shows every AC/EC is covered, plus the design node per screen, the widths in scope, and the build id.
7. **Build the lane plan** ([parallel-test-lanes.md](../../../references/parallel-test-lanes.md) §2–§4):
   group the scenarios into units (shared record · multi-role · one screen's widths/states · chained
   precondition · barrier for anything every lane sees), lease **one account per lane**, and
   write the lease table. Parallel is the default — serial needs a named §4 predicate.
   How this flow applies §2 to roles and guests:
   - **Cross-role chain** (one role acts, a later scenario by another role checks the result — admin
     archives, then the learner's catalog hides it): **one lane per role, each on its own account**,
     with the order written in the lane plan as `L2 #n after L1 #m`. The later lane runs its
     independent scenarios first; its dependent ones start after the earlier lane returns
     (Phase E *Fan out*). Two roles share one lane only when a **single** scenario needs both at the
     same moment, or when the pool has no second account (§3).
   - **Guest / logged-out scenario:** its own unit — §2's one-screen grouping covers one account's
     widths and states, not a logged-out context. It leases no account: count it in `units`, then run it
     in the lane with the shortest expected duration, in a fresh logged-out browser context. Lane count
     stays min(units, leasable accounts) — one learner screen chain + one guest scenario with two
     learner accounts = 2 lanes (guest unit in L2).

---

## Phase C — Show the plan, wait for confirmation [medium freedom]

🔴 GATE: print the intake summary + plan below, then **wait for the user's confirmation before the first Playwright run**, so the user approves scope, environment and accounts before anything runs (owner decision D2 — testing-ticket waits for the user's confirm before the first run, while retest-bug shows its plan and runs; it is the one exception to "no waits" in [round-time-contract.md §2](../../../references/round-time-contract.md)). Do not start Phase D until the user confirms. A correction at this point updates the plan, which is shown again and waits again. After the confirmation
there are no mid-run waits; the plan rides again in the end decisions popup.

**Unattended / bot trigger:** post the same intake summary + plan to the triggering channel with the
project's @mention and wait there for an explicit confirm from a person. Never self-confirm, never treat
silence or a timeout as a confirm, and never start Phase D without it. When the bot's wait ends with no
confirm (its own timeout, the confirm window the project guide names, or the run being stopped): post one
line in the same channel — `Not started — no confirmation for {KEY}; plan above; reply confirm to start a
new round` — release every leased account, end the round as **NOT STARTED** with the plan attached, and run
no Phase D and no external write. A confirm that arrives later starts a new round from Phase B (sessions and
scenarios are re-checked).

```text
━━━ Testing ticket — plan (waiting for your confirmation) ━━━
Ticket:      {KEY} — {one-line summary}
URL:         {url}
Login:       {user} — saved session; dead session = ready-to-run relink/mint commands the user runs, then the agent probes
VPN:         {required|not required} — {note; when required, end it with: environment unreachable in Phase D → stop and report, nothing marked PASSED}
Confluence:  {url or none}
Swagger:     {url or none}
Design ref:  {figma node link(s) per screen — or "none for {screen}: asked {who}"}
Build:       {build / commit id under test}
Widths:      {every scenario incl. split sub-ids × every in-scope width = its own row, no width dropped; overflow (rect.right / scrollWidth > innerWidth) and overlap measured, not eyeballed} — out of scope: {widths not delivered this round}
Login smoke: {role → OK / FAILED} for the in-scope roles

Test plan ({N} scenarios):
  (one row per AC/EC sub-id — AC3a/3b/3c never share a row)
  1. ...
Out of scope: ...

Execution:   parallel — {N} lanes   (or: serial — reason: {§4 predicate})
Lanes:       L1 · {account} ({role}) · scenarios {ids} · data prefix QA-L1
             L2 · {account} ({role}) · scenarios {ids} (#n after L1 #m) · data prefix QA-L2
             ...
Barrier:     {scenario ids run alone after lanes — or "none"; Lanes and Barrier lines are always printed}
Starting state: {state each lane begins in, checked before its first scenario}

Execution plan: see filled template (preflight, evidence, pass criteria). Its Execution lanes rows (L1/L2, QA-L1/QA-L2) and Starting state line are copied from test-execution-plan-template.md, always present.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reply **confirm** to start the run, or tell me what to change.
```

If the results contradict expectations or tests are flaky, follow [qa-debug-discipline.md](../../../references/qa-debug-discipline.md) before changing pass/fail wording. "Flaky" is a hypothesis, not a
conclusion — it needs the E2 investigation and an artifact like any other cause.

**Go back:** If the user corrects the plan at this gate, revise it and show it again (still waiting). If the end decisions popup corrects it after the run, return to Phase C — the correction starts a new round.

---

## Phase D — Pre-flight (mandatory) [low freedom]

At Phase D, follow [playwright-preflight.md](../../../references/playwright-preflight.md) in full. 🔴 GATE: MUST NOT start Phase E until **Ready to run: YES**.

On an Android SuperApp device the branch's own preflight (see also [android-superapp-branch.md §3](references/android-superapp-branch.md)) replaces the browser login steps: device resolved and idle, session live by the app's API (or read from the screen and said so), keyboard frame measured. The gate is the same: without **Ready to run: YES** nothing is recorded.

The login smoke table from *Refusal-first* already shows which roles log in; this phase does not
repeat it. It re-checks each lane's session right before that lane's first scenario, because a session
can expire between the smoke gate and execution.

**Session preflight is part of Ready-to-run** ([customer-escape-prevention.md](../../../references/customer-escape-prevention.md) §9): read the app's own session endpoint and **see the user in the response** before the first scenario — a page that merely loads proves nothing, and an expired session runs the whole set and reports "no defects found". Log the environment, the build id, and
the authenticated user id before the first result line. Any of these missing = stop and report; results recorded after a failed preflight are not results.

**Login reuse** ([round-time-contract.md §5](../../../references/round-time-contract.md)): load the saved login file for the account (`{auth dir from guide}/{env}-{role}-{alias}.json`, named by account, not by lane, gitignored), then call the session endpoint and expect the account's user id. On 401/403, a redirect to login, or a different user, a lane stops that account's cases and
returns `SESSION-DEAD {account tag}` — it never logs in itself. One account belongs to one lane and is never shared across concurrent sessions.

**Fresh login = main thread, login by command** ([parallel-test-lanes.md](../../../references/parallel-test-lanes.md) §3 *Dead session*). Pick lane accounts whose sessions are live first.
- **No login window.** The agent never opens a browser, login window or sign-in page, and never drives a login form, for any test account, whether on the main thread or in a lane (owner order 2026-10-21: log in by command, as the e2e suite does — lanes that logged in by themselves popped a chain of login windows).
- **No password.** The agent never asks for, accepts, collects, stores or fills a password; a password the user pastes is never used or echoed.
- **Relink → mint → probe.** Instead the main thread gives the user the ready-to-run **Relink → Setup/mint → Probe** steps exactly as written in [parallel-test-lanes.md §3 *Dead session*](../../../references/parallel-test-lanes.md#3-account-isolation--no-collision)
  (one combined `bash` block per step, built from the intake answers; the user presses Run; the agent never runs them itself and only probes).
  An account still FAILED after the probe blocks only its cases, which are reported BLOCKED "session not restored", never PASSED. Open that section at Phase D, only when a needed session is not live.

**In a parallel run the session preflight runs per lane**, inside each lane, and records the
authenticated user id — the parent accepts a lane's results only when that id matches the lane's
leased account ([parallel-test-lanes.md](../../../references/parallel-test-lanes.md) §3).

**Go back:** If **Ready to run** is not YES — session user, build id or environment missing — fix the cause and return to the start of Phase D. A lane whose authenticated user id does not match its leased account returns `SESSION-DEAD` (*Login reuse*); the main thread recovers that account and the lane re-runs its preflight before its results count.

---

## Phases E–F — execute and summarize

At Phase E, open [execute-and-summarize.md](execute-and-summarize.md) and follow it through Phase E (execute), the result quality gate and Phase F (summarize in chat); every gate in it is mandatory.

---

## Phase G — update results elsewhere

At Phase G, open and follow [results-update.md](results-update.md) — only when the run updates results outside this chat (sheet, Jira comment, usage marker); every gate in it is mandatory.

---

## Phase H — A question arrives after results were published [low freedom]

A follow-up question is a **defect in the write-up**, not a normal step
([defect-report-completeness.md](../../../references/defect-report-completeness.md) §6).

1. **Re-verify before answering.** If the answer is not already backed by a labelled evidence file from
   this run, re-run that surface. Never answer from memory of an earlier run, and never answer from the
   write-up being questioned.
2. **Check your own evidence set for a contradiction first** — if two captures disagree, that is the real
   subject of the question; resolve it per E1·3 before replying.
3. **Answer in the shape asked** (§7): direct answer first, at most one line of why. If the user says it
   is too long, shorten the same answer — never re-emit it at the same length.
4. **Fold the answer back into the published result** (edit in place — same comment id, same row) and
   re-run the Phase G6 verification, so the next reader never needs the chat thread.
5. **If an earlier statement was wrong**, correct it **visibly in both places**: the in-place edit names
   the corrected claim, **and** a follow-up goes into the thread where the wrong answer was given.
6. Record which F3 block would have prevented the question.

---

## QA closing (mandatory before session end) [low freedom]

At phase close (only when the run reaches QA closing), follow [qa-closing-shared.md](../../../references/qa-closing-shared.md) + skill-specific.
**Run its [cross-ticket conflict check](../../../references/qa-closing-shared.md#cross-ticket-conflict-check) first** — apply its unattended default (step 5) and queue *Investigate further* / *Close out now* into the F5 end decisions popup, before the approval popup ([round-time-contract.md
§3](../../../references/round-time-contract.md)); the session is not done until the user has answered it there:

- [ ] F1–F4 posted before any external update.
- [ ] **AC/EC coverage gate (7-layer)** green — Phase B step 3 · Phase E *Cover every enumerated AC/EC id* · Phase F *AC/EC coverage reconciliation* ([qa-evidence-coverage.md](../../../references/qa-evidence-coverage.md#acec--bug-detail-coverage--7-layer-completeness-defense-gate-mandatory-fail-closed)).
- [ ] Every scenario has PASSED/PWMI/FAILED/BLOCKED (not run = BLOCKED with reason) with evidence reference.
- [ ] **Design (Figma) comparison** done for every UI scenario — Phase B step 4 · [E0](execute-and-summarize.md#e0--design-comparison--depth-checks-every-scenario-passed-ones-included). (file opened at Phase E)
- [ ] **Depth gates** green — Phase F *Design + depth reconciliation* ([customer-escape-prevention.md](../../../references/customer-escape-prevention.md)).
- [ ] **Story evidence-completeness gate (5-step)** green, fail-closed — [qa-evidence-capture.md](../../../references/qa-evidence-capture.md#story-testing-evidence-completeness-gate-5-step-per-story) (MP4s per its [MP4 7-layer gate](../../../references/qa-evidence-capture.md#mp4-evidence--7-layer-quality--correctness-defense-gate-mandatory-fail-closed)).
- [ ] **Pre-delivery completeness gate (7-layer)** green before ANY external write or "done" — [qa-evidence-coverage.md](../../../references/qa-evidence-coverage.md#pre-delivery-completeness--7-layer-defense-gate-before-handing-results-to-the-requester).
- [ ] **F3 defect blocks** complete for every FAILED/BLOCKED defect — Phase F *F3* ([defect-report-completeness.md](../../../references/defect-report-completeness.md)).
- [ ] **E2 root-cause investigation** ran for every FAILED and BLOCKED scenario — [E2](execute-and-summarize.md#e2--root-cause-investigation-mandatory-for-every-failed-and-blocked-scenario-during-the-run). (file opened at Phase E)
- [ ] **E3 challenge gate** ran for every non-PASSED scenario — [E3](execute-and-summarize.md#e3--challenge-the-non-pass--queue-it-for-the-user-mandatory-for-every-non-passed-scenario). (file opened at Phase E)
- [ ] **F4 reader gate + cause gate** passed before Phase G — Phase F *F4* ([execute-and-summarize.md](execute-and-summarize.md#phase-f--summarize-in-this-chat-mandatory-high-freedom)). (file opened at Phase E)
- [ ] If Phase G ran: destination re-read matches agreed column formats.
- [ ] Close-out includes `Verified:` (or partial-failure honesty per Phase F).
- [ ] Phase G6 fix-verify completed when Phase G ran.
- [ ] **Cross-ticket conflict check** ran and answered in the end decisions popup — intro above ([qa-closing-shared.md](../../../references/qa-closing-shared.md#cross-ticket-conflict-check)).
- [ ] **Round-time contract** held (Phase C confirm, no mid-run waits, one approval popup, measured `Round time:` line, handoff with fingerprints) — [round-time-contract.md](../../../references/round-time-contract.md).
- [ ] **Fresh-eyes:** re-read F2 before Phase G when **> 15 scenarios**.
- [ ] [verify-closing-checklist.md](../../../references/verify-closing-checklist.md) (Testing ticket section).
- [ ] When F3 lists a defect, the close-out ends with `Next: create-bug for {scenario ids}` — an offer only; this workflow never files it. Handoff file written every round (§10).

**Go back:** If any item above is unchecked, return to the phase it names (E, F or G) and redo from there; do not report done.

---

## Out of scope

- Filing bugs, retest, TC prep, full-app regression — see [skill-routing.md](../../../references/skill-routing.md)

---

## Next workflows

See [skill-routing.md](../../../references/skill-routing.md) — **Handoffs** after this workflow.

---

## References

Every file this workflow opens is linked from [SKILL.md](../../testing-ticket-workflow/SKILL.md) (*When invoked* + *Contents*, Always / On trigger) and named at its step in the *Progress checklist*. Not required: [workspace-guide-template.md](references/workspace-guide-template.md) (non-secret defaults) and [worked-example.md](references/worked-example.md) (anonymized sample, only when a format reference is needed).

---

## MUST / NEVER

Shared rules, opened only when the run writes or posts: [shared-must-never.md](../../../references/shared-must-never.md). Skill-specific:

| Rule | Because |
|------|---------|
| MUST NOT open Jira/GitHub bugs in this workflow | Use create-bug-workflow |
| MUST run the plan in parallel lanes whenever it has 2+ units, one leased account per lane, lane count = min(units, leasable accounts) with no fixed cap, unless a [parallel-test-lanes.md](../../../references/parallel-test-lanes.md) §4 predicate is named | Shortest run time with no shared login — a shared account ends sessions and shares state, producing false defects |
| NEVER open a browser or login window for a test account, and never ask for, collect or fill a password — login by command, Phase D *Login reuse* and *Fresh login* | Login windows popped a chain of windows at the person; owner order 2026-10-21: login by command, as in the e2e suite |
| MUST pass the 7-layer AC/EC coverage gate — Phase B step 3, Phase E *Cover every enumerated AC/EC id* and Phase F *AC/EC coverage reconciliation* | The run's scope is the ticket's AC/EC contract; a card was once passed with the gap footnoted in a remark — coverage is proven by rows, and "works except one point" reads as a clean pass downstream |
| MUST pass the Phase C confirm gate before the first Playwright run — Phase C | Owner decision D2 (wait for the user's confirm before the first run): the user approves scope, environment and accounts before anything runs; the wait is once, never mid-run |
| NEVER wait mid-run for a user answer — apply the documented default and queue the question for the end decisions popup ([§2](../../../references/round-time-contract.md)) | Human wait blocks the round; the default keeps the run moving and the question still reaches the user |
| MUST execute every external write (comment, result update, notify) under **one** approval popup that names each concrete action, with no second approval ([§3](../../../references/round-time-contract.md)) | One human touch per round; every action is still approved by name |
| MUST end every round report with the measured `Round time: AGENT+EXEC {n} min · human wait {h} min · overrun {…} min` line — never estimated ([§1](../../../references/round-time-contract.md)) | The 15-minute cap is only real if it is measured |
| MUST drive each scenario through its real surface — Phase E *Real surface* | [test-through-real-steps.md](../../../references/test-through-real-steps.md) — an API shortcut for a UI action tests the wrong layer and can pass while the screen is broken |
| MUST attach complete evidence to every case **and every role the case names** before the story is "done" — the 5-step gate in [qa-evidence-capture.md](../../../references/qa-evidence-capture.md#story-testing-evidence-completeness-gate-5-step-per-story) | A story reported "100% passed" while cases have no MP4 (or a minor-issue verdict with no bug) looks finished but is unverified; the pass-rate counts minor-issue as passed and hides the gap |
| MUST judge defect Priority/Severity ONLY from the [Bug Priority & Severity Matrix](../../../references/bug-priority-matrix.md) — never invent a severity notion; PASSED WITH MINOR ISSUE needs a Lowest/Low/Medium bug, FAILED needs High/Highest | Guessing severity produces inconsistent verdicts across testers and tickets |
| MUST re-read destination after Phase G writes | Silent partial failure |
| MUST capture the E1 repro shape during the run: exercise every entry point to a failing surface separately (direct route **and** the in-app path a user takes), one repro-matrix row + screenshot each, untried paths written `not tested`; hard-reload every surface after a state-changing fixture step before observing it, a stale-data window being a separate timing note with a measured delay, never a repro row; resolve any disagreement between your own observations with one clean re-run before writing F2/F3, unresolvable → BLOCKED, not FAILED | A path with no evidence row is a guess published as a finding; an already-open view holds pre-change data, so recording it publishes your test timing as product behavior; resolving a disagreement in favour of the result you already wrote is how a wrong repro path ships |
| MUST NOT write a scope word (`always`, `any entry point`, `both ways`, `only when …`) that no repro-matrix row supports | The scope claim is the first thing a dev builds on |
| MUST give every FAILED/BLOCKED defect the F3 blocks — repro matrix, expected line quoted verbatim vs actual, **root cause**, resolution options with a named owner | These are the questions the reader asks next; answering them in chat leaves the record incomplete |
| MUST run the E2 root-cause investigation for EVERY FAILED and BLOCKED scenario — at E2 | The session state is open only during the run; improvised reasoning afterwards is where guessing enters |
| MUST run the E3 challenge gate for EVERY non-PASSED scenario before listing it as a defect, recommendation (adjust TC / re-test / confirm defect — confirm defect only while the expected is not superseded) — at E3 | A non-PASS against a stale, superseded, or misread expected is a phantom defect; the expected side is the one that must be earned, and adjusting a spec or re-testing is the user's call (post-mortem PM-006 — a bug was filed against an expected nobody had opened; [non-pass-challenge-gate.md](../../../references/non-pass-challenge-gate.md)) |
| MUST NOT file / list a defect whose expected turned out wrong, superseded, or unclear — that is a test-case adjustment or a BLOCKED question, never a defect; unattended bots resolve it as BLOCKED + remark, never a phantom bug and never a halt | Filing the app against an unverified expected is exactly how a phantom bug ships (post-mortem PM-006 — bug filed on an unopened spec) |
| MUST pass every rule in [root-cause-investigation.md § MUST / NEVER](../../../references/root-cause-investigation.md#must--never) at E2 (8-boundary sweep with `not checked` · captured artifact + `Confirmed` / `Suspected` / `Unknown — not investigated` label on every cause, carried into every destination · no [banned hedge](../../../references/root-cause-investigation.md#hedges), symptom or inferred cause as a cause · no product-code patch) | One canonical copy; the rules and their reasons live there |
| MUST classify a test-side cause (selector drift, stale auth, missing fixture, VPN) as a test defect — fix our side and re-run — and MUST NOT file a real product bug as "flaky" | Both directions of the mix-up destroy the run's credibility |
| MUST NOT rewrite a ticket's acceptance/expected text to match observed behavior | The spec owner decides; QA reports the conflict and names them |
| MUST pass the F4 reader gate before Phase G | The gate exists so answers land in the write-up, not in a round-trip that ends in an edited record |
| MUST re-verify before answering any question that arrives after publishing, then fold the answer into the published record in place (Phase H) | Answering from memory publishes wrong claims |
| MUST compare every UI scenario against its design node — Phase B step 4 and E0 (steps 1, 6, 7) | An all-present, mis-ordered screen passes a "shows A, B, C" expected (the set that shipped 25 customer-found defects contained the word `figma` zero times); an assumed expected produces both phantom defects and false passes (post-mortem PM-006 — bug filed on an unopened spec) |
| MUST report a screen this ticket intentionally changed as **design out of date** (name the design owner, ask for the node update in this ticket) instead of listing it as a defect | A relocated menu was reported missing when it existed in a submenu — a full round lost |
| MUST spell out a mid-test AC revision in the verdict (`PASSED against AC as revised {date}, differs from design in {…}`) and hand the difference to the known-limitation list | A silent PASSED on a revised AC shipped the review's only High-severity escape |
| MUST pass every depth rule in [customer-escape-prevention.md § MUST / NEVER](../../../references/customer-escape-prevention.md#must--never) (surface sweep · four-dimension expected · verification method · standing fixture · build id · evidence on passed rows · report the unasked-for · session preflight · open the trace) — opened at Phase B step 5 | One canonical copy; the rules and their shipped-defect reasons live there |
| MUST NOT record a passing verdict on a scenario whose notes contain `caveat` / `not verifiable` / `assumed` / `ยืนยันไม่ได้` / `ตรวจไม่ได้` — it is BLOCKED, or PWMI with a bug | We shipped a PASSED whose own text said it could not be verified, and that was exactly the customer's bug |
| MUST run every in-scope width as its own row in the plan and in the results and judge overflow (`rect.right > innerWidth`, `scrollWidth > innerWidth`) and overlap (>3 px) by **measurement**; out-of-scope widths are stated out of scope | 7 of 25 escapes were on widths nobody ran; measuring caught them the moment it was run |
| MUST run the cross-ticket conflict check before calling the session done — at *QA closing* ([qa-closing-shared.md](../../../references/qa-closing-shared.md#cross-ticket-conflict-check)) | Another ticket in the same project can contradict, supersede, or duplicate what was just verified; a check limited to the tested ticket never sees it |
