---
id: task-z41
title: 'Board summary line: show all section counts including Done and Cancelled'
status: open
priority: medium
type: bug
created_at: 2026-06-03T20:44:45Z
updated_at: 2026-06-03T20:44:45Z
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
---

## Description

The board's summary line currently only reflects the sections visible in the current view mode (focused: 5 sections; all-mode: all 7).

Change it to always show counts for all 7 sections regardless of view mode:

```
○ Ready 5 · ◐ Active 2 · ▲ Blocked 1 · ? Pending 1 · ◇ Stale 0 · ✓ Done 3 · ✗ Cancelled 1
```

Acceptance criteria:
- Summary line always includes Done and Cancelled counts, even in focused mode.
- Sections with zero tasks are still shown (unlike currently where they are hidden).
- The summary fits within the panel width; overflow sections are truncated gracefully.
- Focused/all toggle only affects the task list below, not the summary line.
