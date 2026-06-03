---
id: task-dl4
title: Trim BDD suite to true integration workflows
status: done
priority: medium
type: task
created_at: 2026-06-03T16:32:59Z
updated_at: 2026-06-03T16:43:39Z
created_by: human
assignee: null
depends_on:
  - task-1zg
  - task-lug
  - task-rhc
claim:
  actor: null
  claimed_at: null
  expires_at: null
  heartbeat_at: null
tags:
  - tests
  - bdd
  - refactor
---

## Description

**Files:** `features/tl-board.feature`, `features/step-definitions/tl-board.steps.ts`

**Why:** After Tasks 1-3, 16 of 22 BDD scenarios are redundant — they duplicate what the new unit tests cover. Keeping them adds maintenance burden and slows the test suite. The remaining 6 scenarios cover true end-to-end workflows that cross component boundaries.

**Depends on:** Tasks 1, 2, 3 (removes tests only after unit tests are in place).

**Remove 16 scenarios:**
- Navigate with arrow keys → board-component.test.ts
- Navigate with j/k keys → board-component.test.ts
- Display selected task ID in title → board-component.test.ts
- Open task details from board → board-component.test.ts
- Return from details to list view → board-component.test.ts
- Request implementation of selected task → board-component.test.ts
- Close board without selecting → board-component.test.ts
- Toggle focused/all-mode → board-component.test.ts
- Toggle back to focused → board-component.test.ts
- Press Esc in details → board-component.test.ts + keys.test.ts
- Press Kitty-encoded Esc in details → keys.test.ts
- Press Kitty-encoded Esc with modifier → keys.test.ts
- Press modifyOtherKeys Esc → keys.test.ts
- Press Esc in list closes → board-component.test.ts + keys.test.ts
- Press Kitty-encoded Esc in list → keys.test.ts
- Press Kitty-encoded Enter → keys.test.ts + board-component.test.ts

**Keep 6 scenarios:**
- Open board and see tasks grouped by status (full integration: shell → parse → render)
- Open via Alt+L shortcut (shortcut wiring end-to-end)
- Board overlay has rounded framed panel (visual layout validation)
- Cancel a task from the detail view (async lifecycle: confirm → input → shell)
- Remove a task from the detail view (async lifecycle: confirm → input → shell)
- Press q in details view returns to list (keeps one details-back navigation case)

**Also remove from step definitions:**
- `loadKeys()` function (no longer needed)
- Kitty-encoded Esc/Enter step definitions (5 When clauses)
- Arrow key helpers `arrowUp()` / `arrowDown()` if no navigation scenarios remain

**Acceptance criteria:**
- `npx cucumber-js` passes with 6 scenarios
- All unit tests pass: keys.test.ts, tasks.test.ts, board-component.test.ts, extension.test.mjs
- `npx tsc --noEmit` passes

## Notes

- 2026-06-03T16:43:39Z [pi-agent] note: Trimmed BDD suite from 22→6 scenarios. Removed 16 redundant scenarios (navigation, mode toggle, key encoding, close/select actions) now covered by unit tests. Removed loadKeys(), arrow helpers, and 20 unused step definitions. All 126 unit + 6 BDD pass, tsc clean.
