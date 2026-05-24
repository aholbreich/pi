---
id: task-uhe
title: Add /tl-capture rough todo intake workflow
status: done
priority: high
type: task
created_at: 2026-05-24T17:20:30Z
updated_at: 2026-05-24T18:14:40Z
created_by: pi-agent:plan-tl-ux
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
  - capture
---

## Description

Implement a /tl-capture slash command that opens a multiline editor for rough user todos, then sends a structured follow-up user message asking the agent to refine, deduplicate, prioritize, tag, and create clean tl tasks. The command should avoid creating tasks itself and should ask the agent to confirm ambiguous items before tl_create.

## Notes

- 2026-05-24T18:14:30Z [pi-agent:implement-tl-capture] note: Implemented /tl-capture command: opens editor, builds a refinement prompt, sends it as a user message (followUp if not idle), and avoids direct task creation. Added README entry and test coverage for capture behavior.
- 2026-05-24T18:14:36Z [pi-agent:implement-tl-capture] note: Verification passed: npm test (6 tests) and npm run check. /tl-capture is registered and covered by tests.
