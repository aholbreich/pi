---
id: task-lug
title: Add unit tests for tasks.ts rendering functions
status: done
priority: high
type: task
created_at: 2026-06-03T16:32:59Z
updated_at: 2026-06-03T16:37:27Z
created_by: human
assignee: null
depends_on: []
claim:
  actor: null
  claimed_at: null
  expires_at: null
  heartbeat_at: null
tags:
  - tests
  - tasks
  - unit
---

## Description

**File:** `extensions/tl/tasks.ts` → new test file `tests/tasks.test.ts`

**Why:** The existing test (#4) only checks that `renderTaskLine` omits status words and colors tags differently. Missing: width truncation, selection state, all priority levels, `tasksFromJson` edge cases. These are pure functions that should be exhaustively tested.

**What to test:**

**`renderTaskLine(theme, options)`**
- Basic rendering produces expected structure
- Width truncation: long title + tags fit within width budget
- Width truncation: very narrow width (e.g., 20 columns) still produces valid output
- Selection highlighting (selected=true applies bold/accent)
- Prefix rendering (prefix="▸ " for selected row)
- Section icon + label rendering
- Tag rendering (shows #tag-a #tag-b)
- Tag omission when showTags=false
- Empty/missing title (null, undefined)
- Edge case: width=0

**`priorityIcon(priority)`**
- "high" → { icon: "▲", color: "error" }
- "medium" → { icon: "▲", color: "warning" }
- "low" → { icon: "▲", color: "dim" }
- Unknown string → { icon: "▲", color: "muted" }
- null/undefined → { icon: "▲", color: "muted" }
- Number (not string) → { icon: "▲", color: "muted" }

**`tasksFromJson(raw)`**
- Valid JSON array of tasks → parsed TaskSummary[]
- Empty array → []
- null/undefined → []
- Non-array JSON (object) → []
- Invalid JSON string → []
- Tasks with missing fields (id, title) → still returned, undefined fields preserved

**Implementation:** Same test framework as keys.test.ts. Uses `markedTheme` pattern from existing tests for verifying color/style application. Run via `node --test tests/tasks.test.ts`.

## Notes

- 2026-06-03T16:37:27Z [pi-agent] note: Added tests/tasks.test.mjs: 35 unit tests covering priorityIcon (6), renderTaskLine structure/width/selection/missing-fields (25), and tasksFromJson (4). All pass.
