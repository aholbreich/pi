---
id: task-paj
title: Add show-all toggle to Task Ledger board
status: done
priority: medium
type: task
created_at: 2026-05-24T19:59:25Z
updated_at: 2026-06-01T16:31:40Z
created_by: pi-agent:tl-capture
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
  - overlay
  - keyboard
---

## Description

Add a keyboard toggle in /tl-board to switch between the current focused task set and all ledger tasks.

## Goal
Let users quickly browse the full task ledger (including done/cancelled tasks) from the board without leaving it, then toggle back to the focused active-task view.

## Requirements
- Add a keyboard toggle (key `a`) that switches between two view modes: "focused" (ready/in-progress/blocked/pending/stale) and "all" (focused + done + cancelled, grouped by status).
- In all-mode, append Done and Cancelled sections after the existing five sections (order: Ready, In progress, Blocked, Pending human, Stale claims, Done, Cancelled).
- When toggling between modes, reset selection to the first visible task in the new mode.
- Update the help line to show the current mode and the toggle key (e.g., `a show all • ...` in focused mode, `a focused view • ...` in all mode).
- Document the `a` key in README.
- Add tests covering: toggle enters/leaves all-mode, all-mode shows done/cancelled sections, selection resets on toggle, help line reflects current mode.
- Add a Cucumber `.feature` scenario for the show-all toggle behavior.

## Notes

- 2026-06-01T16:31:37Z [main-pc] note: Implemented show-all toggle (`a` key) in /tl-board. Changes: - board.ts: Added BoardViewMode (focused/all), allEntries from 7 sections (added Done ✓, Cancelled ✗), toggleViewMode() resets selection on switch, help line shows "a show all" / "a focused view" - loadBoardSections: added Done and Cancelled sections via `tl list --status done/cancelled --json` - colorForSection: Done → success, Cancelled → dim - tasks.ts: priorityIcon() shared helper, taskLabel uses priority icon - features/tl-board.feature: 2 new scenarios for toggle behavior - features/step-definitions/tl-board.steps.ts: 5 new step definitions for toggle assertions - tests/extension.test.mjs: updated call counts from 5→7, 6→8 - README.md: documented `a` key All 9 node:test + 11 Cucumber (45 steps) pass. TypeScript clean.
