---
id: task-tlb
title: Change Task Ledger board keybinding to Alt+L
status: done
priority: high
type: bug
created_at: 2026-05-24T19:39:25Z
updated_at: 2026-05-24T19:40:05Z
created_by: pi-agent:tl-keybinding-alt
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

Replace the conflicting Ctrl+Shift+L shortcut for opening the Task Ledger modal board with Alt+L. Ctrl+Shift+L collides with Pi/terminal Ctrl+L behavior; Alt+L is valid per Pi keybinding docs and not listed as a Pi default. Update tests and README.

## Notes

- 2026-05-24T19:39:57Z [pi-agent:tl-keybinding-alt] note: Changed Task Ledger board shortcut from conflicting Ctrl+Shift+L to Alt+L after consulting Pi keybindings docs. Updated command registration, tests, and README. Verification passed: npm test (9 tests) and npm run check.
