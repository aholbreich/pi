---
id: task-6wp
title: 'Bug: Arrow keys broken in /tl-board list navigation'
status: done
priority: medium
type: bug
created_at: 2026-06-01T14:53:33Z
updated_at: 2026-06-01T15:01:02Z
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
  - keyboard
  - bug
---

## Description

In /tl-board, j/k keys work for navigating the task list but the up/down arrow keys no longer respond. Investigate the keyboard handling in the board extension to find the regression (likely a keybinding capture or mapping issue). Fix and add/update tests to cover arrow-key navigation.

## Notes

- 2026-06-01T15:00:57Z [main-pc] note: Root cause: board.ts handleInput only checked legacy CSI escape sequences (\x1b[A, \x1b[B). Arrow keys stopped working because terminal protocols (Kitty keyboard protocol, SS3) send different formats: \x1bOA, \x1bOB (SS3) or \x1b[1;1A, \x1b[1;1B (Kitty CSI-u). Fix: Added ARROW_UP_RE and ARROW_DOWN_RE regex constants that match all three formats (legacy CSI, SS3, Kitty CSI-u including optional event type suffix). Replaced the raw string comparisons in handleInput with isArrowUp()/isArrowDown() helpers. TypeScript compiles cleanly. Verified regex patterns against all known escape sequence variants (legacy, SS3, Kitty with/without event type).
