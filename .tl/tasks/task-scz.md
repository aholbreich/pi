---
id: task-scz
title: 'Adjust tl slash commands: remove history and add list-all picker'
status: done
priority: medium
type: task
created_at: 2026-05-24T17:33:16Z
updated_at: 2026-05-24T17:35:20Z
created_by: pi-agent:adjust-tl-commands
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
---

## Description

Remove the /tl-history user command as low value. Rename /tl-list to /tl-list-all and make it behave like /tl-ready: list tasks with a picker, then show selected task details in a widget. Include closed tasks via tl list --all --json, keep colored human details output, and cap widget output at 100 lines. Update README and run checks.

## Notes

- 2026-05-24T17:34:58Z [pi-agent:adjust-tl-commands] note: Updated slash command implementation: removed /tl-history, replaced /tl-list with /tl-list-all picker using tl list --all --json, reused ready-style select-and-show-details behavior, capped widgets at 100 lines, and updated README.
- 2026-05-24T17:35:17Z [pi-agent:adjust-tl-commands] note: Verification passed: npm run check; mocked extension registration now shows 6 slash commands (/tl-ready, /tl-list-all, /tl-show, /tl-dashboard, /tl-init, /tl-clear); tl list --all --json parses successfully.
