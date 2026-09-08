---
id: task-z41
title: 'Board summary line: show all section counts including Done and Cancelled'
status: done
priority: medium
type: bug
created_at: 2026-06-03T20:44:45Z
updated_at: 2026-09-08T17:50:30Z
created_by: human
assignee: null
depends_on: []
claim:
  actor: null
  claimed_at: null
  expires_at: null
  heartbeat_at: null
tags:
  - extension
  - board
  - ux
---

## Description

The board's summary line currently only reflects the sections visible in the current view mode (focused: 5 sections; all-mode: all 7).

Change it to always show counts for all 7 sections regardless of view mode:

```
○ Ready 5 · ◐ Active 2 · ▲ Blocked 1 · ? Pending 1 · ◇ Stale 0 · ✓ Done 3 · ✗ Cancelled 1
```

Acceptance criteria:
- Summary line always includes Done and Cancelled counts, even in focused mode.
- Sections with zero tasks are still shown (unlike currently where they are hidden).
- The summary fits within the panel width; overflow sections are truncated gracefully.
- Focused/all toggle only affects the task list below, not the summary line.

## Notes

- 2026-09-08T17:50:30Z [agent-name] note: Implemented board summary line showing all section counts. Changes (extensions/tl/board.ts): - summaryLine() no longer filters by view mode or hides zero-count sections: it always renders every board section with its count. - Kept Done and Cancelled visible even when the line overflows: leading sections that fit are shown, then a dim '…', then Done + Cancelled. - Focused/all toggle now only affects the task list, not the summary. Tests: - tests/board-component.test.mjs: added summary includes Done/Cancelled in focused mode, summary unaffected by toggle, overflow keeps Done/Cancelled with ellipsis; updated zero-task-section test to expect its zero count. - tests/board-loading.test.mjs: narrowed a Waiting assertion (summary now always shows 'Waiting 0'). - BDD: 2 new scenarios in features/tl-board.feature (summary shows all section counts incl. closed sections; summary not affected by toggle) + step definition. Verification: - npm run check (tsc): pass. - node --test tests/*.test.mjs: 231 pass, 0 fail. - cucumber-js --name 'Summary line|focused/all toggle': 2 scenarios, 10 steps passed. (Other failing/undefined scenarios are the concurrent pi-agent's in-progress task-28g feature, unrelated to this task.)
