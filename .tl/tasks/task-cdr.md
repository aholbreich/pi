---
id: task-cdr
title: Add navigable Task Ledger board overlay
status: done
priority: medium
type: task
created_at: 2026-05-24T19:06:14Z
updated_at: 2026-05-24T19:08:44Z
created_by: pi-agent:tl-board
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
  - keyboard
  - dashboard
---

## Description

Add an interactive modal overlay command for Task Ledger inspired by rpiv-todo/Pi custom UI architecture. The view should reuse dashboard-style data (ready, in-progress, blocked, pending human, stale), allow keyboard navigation with arrow keys, and support actions for the selected task such as details/view, implement, refine, review, and plan by sending structured agent prompts. Keep the existing passive live overlay unchanged.

## Notes

- 2026-05-24T19:08:40Z [pi-agent:tl-board] note: Implemented /tl-board interactive modal overlay. It loads dashboard-style sections (ready, in-progress, blocked, pending human, stale), opens ctx.ui.custom with overlay positioning, supports arrow/j/k navigation, enter/d details, i implement, r refine, v review, p plan, esc/q close. Selected details show via tl show; agent actions send structured prompts. README and tests updated. Verification passed: npm test (10 tests) and npm run check.
