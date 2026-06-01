---
id: task-paj
title: Add show-all toggle to Task Ledger board
status: open
priority: medium
type: task
created_at: 2026-05-24T19:59:25Z
updated_at: 2026-06-01T15:34:19Z
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
