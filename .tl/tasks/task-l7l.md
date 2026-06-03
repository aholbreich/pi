---
id: task-l7l
title: 'Board details mode: right border overflows on action key row'
status: done
priority: high
type: bug
created_at: 2026-06-03T20:35:16Z
updated_at: 2026-06-03T20:38:24Z
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

In the board modal's details mode, the lower action-key row renders past the right border. 

Observed:
```
│ esc/b back         c cancel           x remove           i impl              │
├─ ○ task-d1o ▲ Audit and improve README docum│ r refine           v review           p plan              │
```

Root cause: `keyFooterLines` computes column count from the first row (4 cols), but row 2 of details mode only has 3 items. `panelStyledLine` uses `cols * colWidth` for visibleLength, which overstates the actual text width. When visibleLength exceeds innerWidth, padding collapses and the right border bleeds.

Also: `panelStyledLine` never truncates `styledInner`, so long task titles or key rows can push the right border past the panel edge even when visibleLength is correct.

Acceptance criteria:
- Right border stays aligned in all board modes (list, details, focused, all).
- Key footer rows render cleanly regardless of column count mismatch between rows.
- Task rows with long titles truncate within the panel instead of breaking the border.
