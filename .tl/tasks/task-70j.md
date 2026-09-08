---
id: task-70j
title: Scrollable task details in the /tl board
status: done
priority: medium
type: bug
created_at: 2026-09-08T12:46:39Z
updated_at: 2026-09-08T13:07:42Z
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
  - ux
references:
  - extensions/tl/board.ts
---

## Description

In the task ledger board (Alt+l dashboard), opening a task detail (enter/d) cuts off long `tl show` output with no way to scroll. The details pane hard-caps output at 18 lines, and arrow/j/k scrolling only works in the list view, not the details view.

Current behavior in `extensions/tl/board.ts`:
- `renderDetails()` truncates with `.split(/\r?\n/).slice(0, 18)`, so long descriptions, references, and history are clipped.
- `handleInput()` in details mode only handles esc/q/b (back), c (cancel), x (remove); there is no scroll handling.

## Acceptance criteria

- Task details longer than the visible area can be scrolled (↑/↓ and/or j/k) while in details mode.
- A scroll indicator appears when content is clipped (e.g. "N more lines" or a position indicator like "showing 1-18 of N").
- Scrolling must not conflict with existing details-mode keys: esc/q/b still go back, c/x still run cancel/remove.
- Short details show no scroll hint and no leftover blank lines.
- List-mode scrolling (the BOARD_MAX_VISIBLE_TASKS window) keeps working unchanged.

## Notes

- 2026-09-08T13:07:40Z [agent-name] note: Implemented scrollable task details in the /tl board. Changes (extensions/tl/board.ts): - Added DETAILS_VISIBLE_LINES=18 window and detailsScrollOffset state. - renderDetails() now slices the detail body by scroll offset instead of a hard .slice(0, 18) and appends a dim 'Showing X-Y of N lines' indicator when clipped. - handleInput() scrolls details with up/down arrows and j/k; esc/q/b still go back, c/x still cancel/remove. - Scroll offset resets on open (showDetails) and back (backToList), and clamps to the last line. Verification: - npm run check (tsc --noEmit): pass. - node --test tests/*.test.mjs: 187 pass, 0 fail (board-component.test.mjs now 50 pass incl. 6 new details-scroll cases). - cucumber-js: tl-board.feature 13 passed (3 new scenarios: long details clipped + indicator, scroll reveals more, short details show no indicator). Remaining 5 undefined scenarios are the pre-existing task-title-wrap.feature gap (task-gbi), unrelated. List-mode scrolling and existing details keys are unchanged and covered by existing tests.
