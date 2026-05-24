---
id: task-g03
title: Add keybinding for Task Ledger modal board
status: done
priority: high
type: task
created_at: 2026-05-24T19:27:15Z
updated_at: 2026-05-24T19:34:41Z
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
  - keyboard
  - overlay
  - board
---

## Description

Add a default keyboard shortcut to open the Task Ledger modal board (/tl-board) so users can quickly show the navigable task panel without typing the command. Document the shortcut and add tests. Choose a keybinding that avoids common Pi conflicts if possible.

## Notes

- 2026-05-24T19:32:31Z [pi-agent:tl-keybinding] note: Implemented default Ctrl+Shift+L shortcut to open the Task Ledger modal board. Refactored board opening into shared command/shortcut path, documented shortcut in README, and added tests for shortcut registration and opening the modal. Verification passed: npm test (9 tests) and npm run check.
- 2026-05-24T19:34:41Z [pi-agent:tl-keybinding] note: Follow-up requested: Ctrl+Shift+L conflicts with Pi/default terminal handling (effectively overlaps Ctrl+L/model selector in many terminals). Consulted Pi keybindings docs; propose switching the Task Ledger board shortcut to Alt+L, which is valid per docs and not listed among Pi defaults.
