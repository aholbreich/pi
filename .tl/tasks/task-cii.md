---
id: task-cii
title: Fix /tl-board Escape-key navigation
status: done
priority: high
type: bug
created_at: 2026-06-01T19:51:15Z
updated_at: 2026-06-01T20:04:50Z
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
  - keyboard
---

## Description

Use Esc as the primary modal navigation key in /tl-board. In details view, pressing Esc should return to the list view. In list view, pressing Esc should close the board modal. Footer hints should advertise Esc as the quit/back key instead of making q primary. Keep q support only if desired for compatibility.

## Notes

- 2026-06-01T20:04:47Z [pi-agent] note: Fixed Esc/q navigation: Esc handled first in handleInput, q in details mode now returns to list instead of closing board, footer hints lead with esc and drop q from hints. Added 3 BDD scenarios. Typecheck and BDD pass.
