---
id: task-l5m
title: Wrap long task titles in board instead of truncating with …
status: open
priority: medium
type: bug
created_at: 2026-06-01T19:57:21Z
updated_at: 2026-06-03T16:45:49Z
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
