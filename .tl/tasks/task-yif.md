---
id: task-yif
title: Use single tl widget and remove tl-clean alias
status: done
priority: medium
type: task
created_at: 2026-05-24T18:06:21Z
updated_at: 2026-05-24T18:07:15Z
created_by: pi-agent:single-tl-widget
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

Improve tl command UX by using one shared widget key for all human-facing tl command output so each command replaces previous output automatically. Keep only /tl-clear for clearing output and remove the /tl-clean alias. Do not add shortcuts yet. Update README and run checks.

## Notes

- 2026-05-24T18:06:59Z [pi-agent:single-tl-widget] note: Updated commands to use one shared widget key (pi-tl) for task details and dashboard so each command replaces previous output. Removed /tl-clean alias, keeping only /tl-clear. Updated README. Running verification next.
- 2026-05-24T18:07:11Z [pi-agent:single-tl-widget] note: Verification passed: npm run check; mocked command registration shows only /tl-ready, /tl-list-all, /tl-show, /tl-dashboard, /tl-init, /tl-clear; confirmed old widget keys and /tl-clean are gone.
