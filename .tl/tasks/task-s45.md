---
id: task-s45
title: Improve dependency visibility in Task Ledger board
status: done
priority: medium
type: task
created_at: 2026-05-24T19:59:25Z
updated_at: 2026-09-08T10:29:57Z
created_by: pi-agent:tl-capture
assignee: null
depends_on:
  - task-paj
claim:
  actor: null
  claimed_at: null
  expires_at: null
  heartbeat_at: null
tags:
  - extension
  - ux
  - board
  - dependencies
---

## Description

Design and implement a clear UX for showing task dependencies in /tl-board. Possible approach: show dependency badges/counts in list rows, and show detailed dependency information in the in-modal details view. Include blocked-by/dependency indicators without making the board too noisy. Update tests and docs.

## Notes

- 2026-09-08T10:22:24Z [codex] note: User reproduced missing tasks in rssb: 15 ledger tasks but board all-view shows only 11. Implementing dependency visibility as a Waiting section for non-ready open tasks, complete all-view inventory from tl list --all, no duplicate rows for stale overlaps, and dependency context in details. Preserve separate explicit Blocked status. Regression Gherkin/tests first; do not expand into unrelated summary-line or passive-overlay UX tickets.
- 2026-09-08T10:29:32Z [codex] note: BDD red: four new dependency visibility scenarios failed before implementation. Green: complete inventory via tl list --all plus ready/stale classification; Waiting includes non-ready open work; closed-only board opens in all view; stale overlaps deduplicated; unknown statuses retained under Other; query/JSON failures surfaced instead of silently hiding tasks. Replaced brittle first-five-section filtering with semantic closed-section exclusion. Existing tl show detail view exposes prerequisites. New unit regression reproduces 15-vs-11 rssb omission. Updated fake CLI fixtures and corrected a pre-existing nav/navigate hint assertion. Scenario with no ready work uses an explicitly blocked prerequisite (not a circular dependency).
- 2026-09-08T10:29:57Z [codex] note: Verified: npm run check passes; all 181 unit tests pass; all 10 board BDD scenarios (43 steps) pass; git diff --check passes. Read-only smoke with real tl 0.9.0 and live /home/aho/git/rssb store found all 19 then-current tasks reachable exactly once (ledger changed since original 15-task report), including task-wk5 with task-7nl prerequisite visible in details. Full BDD suite still has 5 pre-existing undefined title-wrap scenarios/26 steps; follow-up task-gbi records these. npm ci reported 6 existing dependency vulnerabilities; no dependency or lockfile changes made. Changes remain local in /home/aho/git/pi; installed npm extension and Pi settings are untouched, no publish/push performed.
