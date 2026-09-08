---
id: task-gbi
title: Complete missing title-wrapping BDD step definitions
status: open
priority: medium
type: chore
created_at: 2026-09-08T10:29:32Z
updated_at: 2026-09-08T10:29:32Z
created_by: codex
assignee: null
depends_on: []
claim:
  actor: null
  claimed_at: null
  expires_at: null
  heartbeat_at: null
tags: []
references:
  - features/task-title-wrap.feature
  - features/step-definitions/tl-board.steps.ts
  - task-s45
---

## Description

Baseline npm run test:all on fresh checkout 03f8f8a has 5 undefined scenarios / 26 undefined steps in features/task-title-wrap.feature. Implement the missing step definitions so existing title-wrapping acceptance coverage actually executes. Observed while fixing board dependency visibility under task-s45; not caused by that change. Unit tests pass. A separate stale nav/navigate assertion in the board BDD was corrected as part of that work.
