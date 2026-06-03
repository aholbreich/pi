---
id: task-tra
title: Board detail view becomes unresponsive after lifecycle actions (cancel/remove)
status: open
priority: high
type: bug
created_at: 2026-06-03T17:12:16Z
updated_at: 2026-06-03T17:12:16Z
created_by: human
assignee: null
depends_on: []
claim:
  actor: null
  claimed_at: null
  expires_at: null
  heartbeat_at: null
tags:
  - board
  - ux
  - overlay
---

## Description

## Steps to reproduce

1. Alt+L to open the Task Ledger Board
2. Navigate to any task, press Enter to open detail view
3. Press `x` (remove) or `c` (cancel)

## Observed behavior

**(a)** A Yes/No confirmation prompt appears, rendered in the main input area **behind** the board overlay. The board stays open, creating a split/fragmented UI.

**(b)** After confirming Yes and entering a reason, the board detail view stays rendered on screen. Keyboard input no longer reaches the board — Esc, navigation keys, and action keys are all dead. The board becomes a zombie: visible but unreachable.

## Root cause

The `onLifecycle` callback inside `openTaskLedgerBoard` uses `ctx.ui.confirm()` and `ctx.ui.input()` — Pi TUI's built-in prompt system that renders in the main editor area, NOT as an overlay on top of the board. This creates a focus conflict: the board overlay still claims keyboard focus, but the confirm/input prompts also need focus. When the prompts resolve, Pi TUI's overlay focus stack does not restore focus to the board, leaving it rendered but unresponsive.

## Expected behavior

The confirm and input prompts should appear on top of the board (as stacked overlays), or the board should be temporarily dismissed/hidden during the lifecycle flow and re-opened afterward. After the lifecycle action completes, the board should be fully navigable again.

## Affected code

- `extensions/tl/board.ts`: `openTaskLedgerBoard()` lines 53-68 (confirm/input inside overlay callback)
- `extensions/tl/board.ts`: `TaskLedgerBoardComponent.runLifecycle()` line 321-326
