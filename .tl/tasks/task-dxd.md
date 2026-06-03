---
id: task-dxd
title: Add Alt+i and Alt+r shortcuts to implement/refine top Ready task from overlay
status: open
priority: medium
type: task
created_at: 2026-06-03T17:50:33Z
updated_at: 2026-06-03T17:50:33Z
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
  - overlay
  - shortcuts
  - ux
---

## Description

Add global keyboard shortcuts that act on the top Ready task from the summary overlay's cached snapshot:

**Shortcuts:**
- `Alt+i` — claims and starts implementing the first Ready task (sends "Implement task <id>" to agent)
- `Alt+r` — sends refine prompt for the first Ready task

**Visual hint:**
After the first task's title line, show `[Alt+i] [Alt+r]` in dim color as a suffix on that row only:
```
├─ ○ task-abc ▲ Fix login bug  [Alt+i] [Alt+r]
├─ ○ task-def ▲ Add dark mode
```
The hint should only appear when there's at least one Ready task. Use the overlay's cached snapshot (no extra tl calls). If the shortcut is pressed when no Ready task exists, notify the user.

**Implementation:**
1. `index.ts` — register `Alt+i` and `Alt+r` shortcuts, read overlay snapshot to find top Ready task, claim/send agent prompt
2. `task-summary-overlay.ts` — append `[Alt+i] [Alt+r]` suffix to the first Ready task row in `renderOverlayLines`, styled dim
