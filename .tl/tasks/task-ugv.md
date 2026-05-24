---
id: task-ugv
title: Evaluate and implement tl_bulk_create agent tool
status: done
priority: low
type: task
created_at: 2026-05-24T17:20:37Z
updated_at: 2026-05-24T18:43:57Z
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
  - tools
  - bulk
  - ux
---

## Description

Design and optionally implement a tl_bulk_create agent tool that accepts an array of task specs and creates multiple tl tasks with one tool call. Goal: reduce repeated tl_create calls and token overhead for /tl-capture or bulk imports. Include safe error reporting for partial failures and decide whether rollback is needed or not.

## Notes

- 2026-05-24T18:43:39Z [pi-agent:bulk-create] note: Implemented tl_bulk_create agent tool. It creates tasks sequentially from an approved array of specs, supports shared actor/title/description/priority/type/tags, reports created tasks and partial failures without rollback, and marks result isError when any item fails. README and tests updated.
- 2026-05-24T18:43:51Z [pi-agent:bulk-create] note: Verification passed: npm test (8 tests) and npm run check.
