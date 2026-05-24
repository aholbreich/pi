---
id: task-phe
title: Add live Task Ledger overlay widget
status: done
priority: medium
type: task
created_at: 2026-05-24T18:48:45Z
updated_at: 2026-05-24T18:52:22Z
created_by: pi-agent:tl-overlay
assignee: null
depends_on: []
claim:
  actor: null
  claimed_at: null
  expires_at: null
  heartbeat_at: null
tags:
  - extension
  - ux
  - overlay
  - dashboard
---

## Description

Borrow the rpiv-todo overlay architecture for pi-tl: add an above-editor Task Ledger overlay that summarizes ready, in-progress, blocked, pending human, and stale tasks with theme colors, auto-hide/empty behavior, and refresh hooks after tl tools/commands and session events. Keep tl as repository source of truth; do not replace it with session-local todos.

## Notes

- 2026-05-24T18:51:45Z [pi-agent:tl-overlay] note: Implemented live Task Ledger overlay architecture inspired by rpiv-todo: new TaskLedgerOverlay class registers an aboveEditor widget, refreshes from tl JSON output, auto-hides when empty/no ledger, uses theme colors/truncation, and updates on session start, tool_execution_end for successful tl_* tools, session_compact, session_tree, and tl-init. Kept manual command output in separate widget. Added README docs and overlay tests.
- 2026-05-24T18:51:51Z [pi-agent:tl-overlay] note: Verification passed after implementation: npm test (9 tests) and npm run check.
- 2026-05-24T18:52:22Z [pi-agent:tl-overlay] note: Post-cleanup verification still passes: npm test (9 tests) and npm run check.
