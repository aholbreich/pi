---
id: task-4m7
title: Remove /tl-ready user command
status: done
priority: medium
type: chore
created_at: 2026-05-24T19:23:00Z
updated_at: 2026-05-24T19:49:55Z
created_by: pi-agent:tl-capture
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
  - cleanup
---

## Description

Remove the /tl-ready slash command from the Pi extension now that /tl-board provides the preferred task selection/action workflow. Update tests and README accordingly.

## Notes

- 2026-05-24T19:49:49Z [pi-agent:tl-ready-cleanup] note: Removed the /tl-ready user command now that /tl-board is the preferred task workflow. Cleaned up unused command imports/helpers, updated README and tests to assert /tl-ready is absent. Verification passed: npm test (9 tests) and npm run check.
