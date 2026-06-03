---
id: task-1dz
title: Sort in-progress items to top of task ledger board
status: done
priority: medium
type: bug
created_at: 2026-06-03T16:37:19Z
updated_at: 2026-06-03T17:58:19Z
created_by: human
assignee: null
depends_on: []
claim:
  actor: null
  claimed_at: null
  expires_at: null
  heartbeat_at: null
tags:
  - tl
  - board
  - ui
  - sorting
---

## Description

The task ledger board (TUI) should display in-progress (in_progress) items at the top of the list. The underlying `tl list` command already supports this sort order, so the fix is likely in the board rendering logic to pass the appropriate flag or apply the same sort.

## Notes

- 2026-06-03T17:58:19Z [pi-agent] note: Moved In progress section before Ready in loadBoardSections definitions array. Board now displays in-progress items at the top. Focused mode still shows first 5 sections (IP, Ready, Blocked, Pending, Stale). No test impact.
