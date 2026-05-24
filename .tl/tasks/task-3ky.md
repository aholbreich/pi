---
id: task-3ky
title: Add human-facing tl slash commands
status: done
priority: medium
type: task
created_at: 2026-05-24T17:20:26Z
updated_at: 2026-05-24T17:22:34Z
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
  - commands
  - ux
---

## Description

Add user slash commands for common tl workflows beyond /tl-ready and /tl-clear. Candidate commands: /tl-list, /tl-show <id>, /tl-history [id], /tl-init, and /tl-dashboard. Keep agent tools separate from user commands and preserve current behavior.

## Notes

- 2026-05-24T17:22:15Z [pi-agent:implement-tl-commands] note: Implemented new slash commands in extensions/tl/commands.ts: /tl-list, /tl-show, /tl-history, /tl-dashboard, /tl-init, and expanded /tl-clear to clear all widgets. Updated README command list. Running verification next.
- 2026-05-24T17:22:33Z [pi-agent:implement-tl-commands] note: Verification passed: npm run check; mocked extension registration shows 18 tools and 7 commands (/tl-ready, /tl-list, /tl-show, /tl-history, /tl-dashboard, /tl-init, /tl-clear); smoke-tested underlying tl ready/list/show/history/stale commands.
