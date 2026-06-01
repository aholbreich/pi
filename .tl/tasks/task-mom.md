---
id: task-mom
title: Ensure Task Ledger summary overlay refreshes after all tl operations
status: open
priority: high
type: bug
created_at: 2026-06-01T19:58:50Z
updated_at: 2026-06-01T19:59:55Z
created_by: human
assignee: null
depends_on: []
claim:
  actor: null
  claimed_at: null
  expires_at: null
  heartbeat_at: null
tags:
  - extension
  - overlay
  - ux
---

## Description

/tl-board lifecycle actions (cancel/remove) do not refresh the passive summary overlay, so row counts and status become stale. The overlay should refresh after any agent turn where a tl CLI command may have been run, not just after tl_bulk_create.

## Notes

- 2026-06-01T19:59:55Z [pi-agent] note: Approach: add a turn_end handler in index.ts that refreshes the TaskLedgerOverlay after every agent turn. This catches all tl CLI commands regardless of which tool the agent used (bash, tl_bulk_create, etc.). Simpler and more robust than parsing bash arguments.
