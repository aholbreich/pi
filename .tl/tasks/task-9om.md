---
id: task-9om
title: Add /tl-triage prompt template
status: open
priority: medium
type: task
created_at: 2026-05-24T17:20:34Z
updated_at: 2026-05-24T20:04:56Z
created_by: pi-agent:plan-tl-ux
assignee: null
depends_on: []
claim:
  actor: null
  claimed_at: null
  expires_at: null
  heartbeat_at: null
tags:
  - prompts
  - ux
  - triage
  - refinement
---

## Description

Add a Pi prompt template for `/tl-triage` that guides the agent to review current Task Ledger tasks for duplicates, gaps, unclear scope, stale priorities/statuses, blocked/pending issues, and missing dependencies. The prompt should ask the agent to inspect relevant tl data, summarize findings, and propose refinements or follow-up tasks without changing tasks until the user confirms. Do not add `/tl-refine-task` or `/tl-capture-todos` templates in this task.
