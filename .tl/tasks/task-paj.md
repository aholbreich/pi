---
id: task-paj
title: Add show-all toggle to Task Ledger board
status: open
priority: medium
type: task
created_at: 2026-05-24T19:59:25Z
updated_at: 2026-05-24T19:59:25Z
created_by: pi-agent:tl-capture
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
  - board
  - overlay
  - keyboard
---

## Description

Add a keyboard toggle in /tl-board to switch between the current focused task set and all ledger tasks. Current view should keep showing ready/in-progress/blocked/pending/stale tasks; show-all should include done/cancelled/other statuses as well, likely grouped by status. Suggested key: `a` for all/current. Document the key and update tests.
