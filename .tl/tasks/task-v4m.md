---
id: task-v4m
title: Add action picker to /tl-ready
status: done
priority: medium
type: task
created_at: 2026-05-24T18:28:30Z
updated_at: 2026-05-24T18:29:44Z
created_by: pi-agent:ready-actions
assignee: null
depends_on: []
claim:
  actor: null
  claimed_at: null
  expires_at: null
  heartbeat_at: null
tags:
  - extension
  - commands
  - ux
---

## Description

Enhance /tl-ready so after selecting a ready task and showing details, the user can choose an action such as view details only, start implementation, refine task, review task, or plan only. For agent-driven actions, send a structured user message with the selected task id and appropriate instructions. Keep current details-only behavior as an option and add tests.

## Notes

- 2026-05-24T18:29:28Z [pi-agent:ready-actions] note: Implemented /tl-ready action picker after task selection. It still shows details, then offers View details only, Start implementation, Refine task, Review task, or Plan only. Agent-driven actions send structured user messages for the selected task. Added test coverage for Start implementation.
- 2026-05-24T18:29:42Z [pi-agent:ready-actions] note: Verification passed: npm test (7 tests) and npm run check. README updated to document /tl-ready action choices.
