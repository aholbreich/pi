---
id: task-l5m
title: Wrap long task titles in board instead of truncating with …
status: done
priority: medium
type: bug
created_at: 2026-06-01T19:57:21Z
updated_at: 2026-06-03T17:10:40Z
created_by: human
assignee: null
depends_on: []
claim:
  actor: null
  claimed_at: null
  expires_at: null
  heartbeat_at: null
tags:
  - architecture
  - extension
  - maintainability
---

## Description

Task titles that exceed the board line width are currently truncated with an ellipsis (`…`). Instead, long titles should wrap to the next line. This requires changes to `renderTaskLine` in `tasks.ts` (multi-line output) and the board list rendering in `board.ts` (entries currently assume one row each).

## Notes

- 2026-06-03T17:10:38Z [pi-agent] note: Implemented title wrapping in board: (1) renderTaskLine in tasks.ts now returns RenderedLine[] — long titles split at word boundaries into continuation lines with indent alignment, tags dropped when title wraps. (2) board.ts renderList and renderDetails flatten multi-line entries via for-of loops. (3) task-summary-overlay.ts renderOverlayLines callback type updated to string[], flattens wrapped rows. (4) All 165 tests pass, updated truncation-ellipsis tests to verify wrapping behavior. BDD feature file at features/task-title-wrap.feature.
