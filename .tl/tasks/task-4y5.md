---
id: task-4y5
title: Add cancel and remove task actions to /tl-board detail view
status: done
priority: medium
type: task
created_at: 2026-06-01T16:01:27Z
updated_at: 2026-06-01T16:37:15Z
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
  - ux
  - board
  - lifecycle
---

## Description

Add task lifecycle actions to the /tl-board detail view so users can cancel or remove a task directly from the board without leaving it.

## Requirements
- In detail mode, show `c` (cancel task) and `x` (remove task) in the help line alongside existing keys
- Pressing `c` prompts confirmation, then runs `tl cancel` with the user's reason (collected via a brief input)
- Pressing `x` prompts confirmation, then runs `tl remove` for the selected task
- After successful cancel/remove, refresh the board to reflect the change
- Update tests: unit coverage for new handleInput keys, Cucumber scenario for cancel workflow

## Notes

- 2026-06-01T16:37:09Z [main-pc] note: Added cancel (`c`) and remove (`x`) actions to /tl-board detail view. Changes: - board.ts: Added onLifecycle callback to component constructor, runLifecycle() method, c/x keys in detail-mode handleInput, updated help line - board.ts openTaskLedgerBoard: lifecycle closure handles confirm → input → runTl for cancel, confirm → runTl for remove. Board stays open, returns to list view on success. - commands.ts: Removed cancel/remove from BoardAction (handled inline, not via done/selection) - features/tl-board.feature: new scenario "Cancel a task from the detail view" - features/step-definitions/tl-board.steps.ts: added When "requests to cancel", Then "is cancelled", mock input, async wait for lifecycle All 9 node:test + 12 Cucumber (50 steps) pass. TypeScript clean.
