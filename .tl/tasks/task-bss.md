---
id: task-bss
title: Auto-expand board to show all when focused view has only one entry
status: done
priority: low
type: bug
created_at: 2026-06-03T20:24:30Z
updated_at: 2026-06-03T20:33:45Z
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

When the board's focused view (default: sections In progress through Stale claims) ends up with exactly one visible entry, automatically switch to "all" view mode as if the `a` key were pressed.

This avoids showing a board that feels empty when most sections are bare. The switch should happen during initial render, not as a separate action.

Acceptance criteria:
- Board opens in "all" mode when focused entries count is 1.
- Board still opens in "focused" mode when focused entries count is 0 or ≥2.
- `a` key toggle still works after auto-expand.

## Notes

- 2026-06-03T20:33:45Z [pi-agent] note: Added auto-expand in constructor: when focusedEntries count is 1 and allEntries has more, viewMode starts as 'all'. Toggle still works — pressing 'a' switches back to focused.
