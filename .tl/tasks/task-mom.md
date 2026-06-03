---
id: task-mom
title: Ensure Task Ledger summary overlay refreshes after all tl operations
status: done
priority: high
type: bug
created_at: 2026-06-01T19:58:50Z
updated_at: 2026-06-03T17:02:16Z
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
- 2026-06-03T17:02:13Z [pi-agent] note: Implemented: (1) Replaced narrow tool_execution_end handler for tl_bulk_create with broader turn_end handler in index.ts — catches all tl CLI commands regardless of which tool the agent used. (2) Threaded onLedgerChanged callback through openTaskLedgerBoard and openBoardAndHandleSelection so board lifecycle actions (cancel/remove) trigger overlay refresh. (3) Narrowed callback types from ExtensionCommandContext to ExtensionContext since the board only has ExtensionContext available.
