---
id: task-lfr
title: Rework overlay quick-action hints as compact Alt+key legend
status: open
priority: medium
type: task
created_at: 2026-06-03T20:27:12Z
updated_at: 2026-06-03T20:27:12Z
created_by: human
assignee: null
depends_on: []
claim:
  actor: null
  claimed_at: null
  expires_at: null
  heartbeat_at: null
tags:
  - overlay
  - ux
  - shortcuts
---

## Description

Current planned overlay hint format: [Alt+i] [Alt+r] tacked onto the first Ready task row. This is verbose and limited.\n\nReplace with a compact legend format below the first task row:\n\n\nThe Alt modifier is shown once, then each action key follows with its label. This:\n- Uses less horizontal space (Alt prefix shared)\n- Scales to more shortcuts (just add key+label pairs)\n- Is more readable (common modifier extracted)\n- Stays dim-colored to not distract from task rows\n\nShortcuts to show:\n- i implement — claims + starts implementing first Ready task\n- r refine — sends refine prompt for first Ready task\n- p plan — sends plan prompt for first Ready task\n\nOnly show when there is at least one Ready task.
