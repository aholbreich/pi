---
id: task-psb
title: Clear prior task detail widget when showing tl dashboard
status: done
priority: low
type: task
created_at: 2026-05-24T18:01:35Z
updated_at: 2026-05-24T18:02:29Z
created_by: pi-agent:dashboard-cleanup
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

Update /tl-dashboard so it clears any previous task detail widget output before rendering the dashboard, avoiding stale selected-task details remaining on screen. Run type checks and verify command registration.

## Notes

- 2026-05-24T18:02:25Z [pi-agent:dashboard-cleanup] note: Updated /tl-dashboard to clear previous task details before rendering. Also added /tl-clean as an alias for /tl-clear and factored widget clearing into a helper. Verification passed: npm run check and mocked command registration shows tl-clean.
