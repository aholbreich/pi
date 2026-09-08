---
id: task-lfr
title: Rework overlay quick-action hints as compact Alt+key legend
status: done
priority: medium
type: task
created_at: 2026-06-03T20:27:12Z
updated_at: 2026-09-08T18:14:55Z
created_by: human
assignee: null
depends_on: []
claim:
  actor: null
  claimed_at: null
  expires_at: null
  heartbeat_at: null
tags:
  - overlay
  - ux
  - shortcuts
---

## Description

Current planned overlay hint format: [Alt+i] [Alt+r] tacked onto the first Ready task row. This is verbose and limited.\n\nReplace with a compact legend format below the first task row:\n\n\nThe Alt modifier is shown once, then each action key follows with its label. This:\n- Uses less horizontal space (Alt prefix shared)\n- Scales to more shortcuts (just add key+label pairs)\n- Is more readable (common modifier extracted)\n- Stays dim-colored to not distract from task rows\n\nShortcuts to show:\n- i implement — claims + starts implementing first Ready task\n- r refine — sends refine prompt for first Ready task\n- p plan — sends plan prompt for first Ready task\n\nOnly show when there is at least one Ready task.

## Notes

- 2026-09-08T18:14:55Z [agent-name] note: Implemented the compact Alt+key legend. Changes: - task-summary-overlay.ts: removed the inline '[Alt+i]Impl [Alt+r]Ref' hint and READY_ACTION_HINT(_SPACING). renderOverlayLines now inserts a dim legend line 'Alt: i implement · r refine · p plan' directly below the first Ready task row, exactly once, only when a Ready task exists. It uses the '├─' prefix (so the existing └─ last-line closure still applies) and fitStyled for width truncation. - index.ts: added the Alt+p shortcut ('Plan top ready Task Ledger task') so the legend's 'p plan' entry is real; it sends the 'Plan only' prompt for the first ready task, mirroring Alt+r (no claim). Tests: - overlay-render.test.mjs: replaced the two inline-hint tests with legend tests (legend shown once below the first ready row; absent when no ready tasks; no legacy '[Alt+i]Impl' text). - extension.test.mjs: added Alt+p plan-request test and updated the registered-shortcuts count 4 -> 5 (now includes alt+p). Verification: - npm run check (tsc): pass. - node --test tests/*.test.mjs: 267 pass, 0 fail. - cucumber-js: 47 scenarios / 196 steps pass (full suite green). BDD note: no new feature file — this is a small pure-render hint change fully covered by overlay-render unit tests; the full BDD suite remains green.
