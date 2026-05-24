---
id: task-s2z
title: Show /tl-board details inside modal and style panel background
status: done
priority: medium
type: task
created_at: 2026-05-24T19:10:47Z
updated_at: 2026-05-24T19:12:51Z
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

Improve the interactive /tl-board overlay: pressing enter/d should load and display tl show details inside the same modal panel instead of closing to the shared widget. Add a distinct panel background using Pi theme background colors while keeping keyboard actions for implement/refine/review/plan.

## Notes

- 2026-05-24T19:12:47Z [pi-agent:tl-board] note: Updated /tl-board so enter/d loads tl show details inside the same modal instead of closing to the shared widget. Added b/esc back navigation from details to list and applied theme customMessageBg background to board lines. README and tests updated. Verification passed: npm test (11 tests) and npm run check.
