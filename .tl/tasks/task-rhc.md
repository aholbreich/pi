---
id: task-rhc
title: Add unit tests for TaskLedgerBoardComponent state machine
status: done
priority: medium
type: task
created_at: 2026-06-03T16:32:59Z
updated_at: 2026-06-03T16:40:30Z
created_by: human
assignee: null
depends_on:
  - task-1zg
claim:
  actor: null
  claimed_at: null
  expires_at: null
  heartbeat_at: null
tags:
  - tests
  - board
  - unit
---

## Description

**File:** `extensions/tl/board.ts` → new test file `tests/board-component.test.ts`

**Why:** The board component has a non-trivial state machine (modes, scroll, selection) currently tested only through BDD scenarios and two integration tests. Direct unit testing of the component — instantiated with mock `tui`, `theme`, `loadDetails`, and `done` — provides faster feedback and more thorough coverage of edge cases.

**Depends on:** Task 1 (keys.test.ts establishes import patterns).

**What to test:**

**Initial state**
- render produces title line, help line, border
- First task is selected (pointer = "▸")
- Mode is "list", viewMode is "focused"

**Navigation (list mode)**
- Arrow down / "j" moves selection to next task
- Arrow up / "k" moves selection to previous task
- Selection clamped at 0 (up at first task → no change)
- Selection clamped at total-1 (down at last task → no change)
- Scroll offset tracks selection (scrolling past visible window)
- Non-navigation keys do not change selection

**Mode transitions**
- Enter / "d" → enters details mode, shows loading state
- Esc → details mode returns to list
- Esc → list mode calls done(undefined)
- "q" → details mode returns to list (not close)
- "q" → list mode calls done(undefined)
- "b" → details mode returns to list
- "b" → ignored in list mode (no effect)

**View mode toggle**
- "a" → toggles from focused to all-mode
- "a" again → toggles from all-mode to focused
- Toggle resets selection to index 0
- Toggle resets scroll offset to 0

**Action dispatch**
- "i" → done({ action: "implement", id: selectedId })
- "r" → done({ action: "refine", id: selectedId })
- "v" → done({ action: "review", id: selectedId })
- "p" → done({ action: "plan", id: selectedId })
- Action ignored when no task selected

**Render output assertions**
- Selected row uses "▸" pointer
- Non-selected rows use "·" pointer
- Details mode shows details header + loaded text
- Details loading state shows "Loading task details…"
- All-mode shows "Done" and "Cancelled" sections
- Focused mode hides "Done" and "Cancelled" sections
- Help line varies by mode (list vs details)
- Overflow indicator shows "Showing X-Y of Z" when tasks > max

**Implementation:** Factory function `createComponent({ sections, loadDetails?, done?, onLifecycle? })` returns component. `loadDetails` mock returns "task-X full details" after async tick. `done` mock records arguments for assertion. `tui` mock: `{ requestRender: () => {} }`. `theme` mock: identity functions. Import via jiti.

## Notes

- 2026-06-03T16:40:30Z [pi-agent] note: Added tests/board-component.test.mjs: 38 unit tests covering initial state, navigation (up/down/j/k), scroll, details mode (enter/d), escape/q/b in list/details, mode toggle, action dispatch (i/r/v/p), lifecycle (c/x), all-mode sections, and empty state. Exported TaskLedgerBoardComponent class for testing.
