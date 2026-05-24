---
id: task-fpe
title: Use colored tl output for human-facing slash command widgets
status: done
priority: medium
type: task
created_at: 2026-05-24T17:27:38Z
updated_at: 2026-05-24T17:28:46Z
created_by: pi-agent:color-tl-commands
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
  - color
---

## Description

Update command execution so human-facing slash commands use `tl --color always` when Pi has a UI, while agent tools and non-UI modes continue using `--color never`. Keep JSON/tool output clean. Verify /tl-list and dashboard-style commands still work.

## Notes

- 2026-05-24T17:28:43Z [pi-agent:color-tl-commands] note: Implemented color option in runTl and updated slash commands to pass --color always when ctx.hasUI, otherwise --color never. Agent tools remain default color never. Updated README note. Verification: npm run check passed; tl --color always list emits ANSI.
