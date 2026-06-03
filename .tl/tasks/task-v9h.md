---
id: task-v9h
title: Board remove action must force-remove open tasks
status: done
priority: high
type: bug
created_at: 2026-06-03T17:54:50Z
updated_at: 2026-06-03T17:55:52Z
created_by: human
assignee: null
depends_on: []
claim:
  actor: null
  claimed_at: null
  expires_at: null
  heartbeat_at: null
tags:
  - board
  - lifecycle
---

## Description

Real tl remove requires --force when removing open/non-cancelled tasks. Board remove currently calls tl remove without --force, receives exit code 4, and task remains visible after board reopens. Fix board lifecycle remove to pass --force and add regression test.

## Notes

- 2026-06-03T17:55:52Z [pi-agent] note: Confirmed real tl behavior in temp ledger: tl remove open task without --force exits 4 with 'use --force to remove non-cancelled tasks'; with --force exits 0 and task is gone. Fixed commands.ts to add --force to board remove lifecycle. Added integration regression test asserting tl remove includes --message, reason, and --force. 166 unit tests pass; tsc clean; tl-board BDD scenarios pass (full cucumber still has unrelated undefined task-title-wrap feature).
