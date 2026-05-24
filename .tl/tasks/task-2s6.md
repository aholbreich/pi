---
id: task-2s6
title: Remove legacy tl dashboard/list/clear commands
status: done
priority: medium
type: task
created_at: 2026-05-24T19:18:24Z
updated_at: 2026-05-24T19:19:52Z
created_by: pi-agent:tl-command-cleanup
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

Remove legacy user-facing Task Ledger slash commands now superseded by the new overlay board UX. Drop /tl-dashboard and /tl-clear, and remove the old all-tasks picker command (/tl-list-all, interpreted from the requested tl-show-all wording). Keep /tl-board, /tl-ready, /tl-show, /tl-capture, and /tl-init.

## Notes

- 2026-05-24T19:19:48Z [pi-agent:tl-command-cleanup] note: Removed legacy user slash commands /tl-list-all, /tl-dashboard, and /tl-clear; interpreted requested tl-show-all as the existing /tl-list-all command. Kept /tl-ready, /tl-show, /tl-capture, /tl-board, and /tl-init. Updated README and tests. Verification passed: npm test (8 tests) and npm run check.
