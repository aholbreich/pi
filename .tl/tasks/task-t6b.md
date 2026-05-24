---
id: task-t6b
title: Remove /tl-show user command
status: done
priority: medium
type: chore
created_at: 2026-05-24T19:23:00Z
updated_at: 2026-05-24T19:55:52Z
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

Remove the /tl-show <id> slash command from the Pi extension. Task details should be viewed through /tl-board instead. Update tests and README accordingly.

## Notes

- 2026-05-24T19:55:49Z [pi-agent:tl-show-cleanup] note: Removed the /tl-show user command now that task details are shown in /tl-board. Cleaned up now-unused widget helpers and command output helpers, updated README and tests to assert /tl-show is absent. Verification passed: npm test (9 tests) and npm run check.
