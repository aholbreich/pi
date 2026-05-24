---
id: task-v24
title: Use colon style labels for tl agent tools
status: done
priority: low
type: task
created_at: 2026-05-24T18:20:50Z
updated_at: 2026-05-24T18:21:23Z
created_by: pi-agent:label-colons
assignee: null
depends_on: []
claim:
  actor: null
  claimed_at: null
  expires_at: null
  heartbeat_at: null
tags:
  - extension
  - tools
  - ux
---

## Description

Update user-visible labels for tl agent tools to use colon style, e.g. label `tl:create` while keeping provider-safe tool names like `tl_create`. Update tests if needed and run npm test / npm run check.

## Notes

- 2026-05-24T18:21:13Z [pi-agent:label-colons] note: Updated all agent tool labels to colon style (e.g. tl:create, tl:dep:add) while keeping provider-safe tool names unchanged. Added test assertions for representative labels.
- 2026-05-24T18:21:21Z [pi-agent:label-colons] note: Verification passed: npm test (6 tests) and npm run check.
