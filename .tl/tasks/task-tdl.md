---
id: task-tdl
title: Fix Alt+T overlay toggle not clearing visible widget
status: done
priority: high
type: bug
created_at: 2026-05-24T19:45:58Z
updated_at: 2026-05-24T19:46:33Z
created_by: pi-agent:tl-overlay-toggle
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
  - keyboard
  - overlay
---

## Description

Alt+T currently emits the 'Task Ledger overlay hidden' notification but the passive Task Ledger widget remains visible. Fix overlay widget lifecycle so hiding always clears the widget from Pi UI, including after component invalidation/theme refresh. Add regression test.

## Notes

- 2026-05-24T19:46:28Z [pi-agent:tl-overlay-toggle] note: Fixed Alt+T overlay hiding bug. Root cause: widget component invalidate() reset internal widgetRegistered state, so later hide skipped setWidget(undefined) while the widget was still visible. Changed invalidate to no-op and made hide always call setWidget(undefined) when a UI context exists. Added regression coverage that invalidates before toggling hidden. Verification passed: npm test (10 tests) and npm run check.
