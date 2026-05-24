---
id: task-yq4
title: Add automated tests for pi-tl extension
status: done
priority: medium
type: task
created_at: 2026-05-24T18:08:39Z
updated_at: 2026-05-24T18:11:02Z
created_by: pi-agent:add-tests
assignee: null
depends_on: []
claim:
  actor: null
  claimed_at: null
  expires_at: null
  heartbeat_at: null
tags:
  - tests
  - extension
---

## Description

Add a lightweight automated test suite covering extension registration and key command behavior, especially current slash commands, single shared widget behavior, color options for UI commands, and helper functions where practical. Wire tests into package scripts and verify with npm test and npm run check.

## Notes

- 2026-05-24T18:09:51Z [pi-agent:add-tests] note: Added node:test suite in tests/extension.test.mjs and npm test script. Tests cover command/tool registration, /tl-list-all picker behavior with shared widget, /tl-dashboard shared widget, /tl-clear, and tool color default. Running verification next.
- 2026-05-24T18:10:59Z [pi-agent:add-tests] note: Verification passed: npm test (5 node:test tests) and npm run check. Added README development note for npm test.
