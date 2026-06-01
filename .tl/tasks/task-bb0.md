---
id: task-bb0
title: UX improvements for the /tl-board overlay
status: done
priority: medium
type: task
created_at: 2026-06-01T16:00:06Z
updated_at: 2026-06-01T16:05:46Z
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
  - overlay
  - visual
---

## Description

Improve the visual and interaction UX of the /tl-board interactive overlay panel.

## Goal
Make the board overlay feel like a polished, readable panel with clear visual structure.

## Scope (to be confirmed during analysis)
- Add visible borders around the panel
- Improve internal padding so content doesn't crowd edges
- Ensure text colors, contrast, and styling are readable against the panel background
- Consider a distinct panel background color via the Pi theme API

## Approach
1. Review the current render output in `board.ts` against the Pi TUI theme API (`theme.bg`, `theme.fg`, etc.)
2. Propose specific visual changes with before/after render examples
3. Implement approved changes, update tests, and add a Cucumber scenario for visual structure assertions

## Notes

- 2026-06-01T16:05:43Z [main-pc] note: Implemented framed panel UX for /tl-board overlay. Changes: - board.ts: Added borderTop/borderBottom/separatorLine methods using box-drawing characters (┌─┐, └─┘, ├─┤). Modified panelLine to add vertical framing (│ content │) with 1-char inner padding on each side. Extracted PanelColor type. Refactored render() to compose borders + framed lines. - features/tl-board.feature: Added scenario "Board overlay has a framed panel with borders and padding" checking top/bottom/vertical borders. - features/step-definitions/tl-board.steps.ts: Added 3 Then steps for border assertions. Fixed 2 line-index assertions (title [0]→[1], help [1]→[2]). All 9 node:test + 9 Cucumber scenarios (35 steps) pass. TypeScript clean.
