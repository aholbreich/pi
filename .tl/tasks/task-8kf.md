---
id: task-8kf
title: Fix /tl-dashboard empty sections and color preservation
status: done
priority: medium
type: bug
created_at: 2026-05-24T18:16:51Z
updated_at: 2026-05-24T18:35:35Z
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
  - commands
  - ux
  - dashboard
---

## Description

## Goal
Improve `/tl-dashboard` widget output so it remains readable and useful when some task categories are empty.

## Requirements
- Preserve colored `tl` output in the Pi dashboard widget when UI color is supported.
- For each dashboard section, show an explicit empty-state message instead of an empty table/list.
- Use section-specific wording, for example:
  - `No ready tasks`
  - `No in-progress tasks`
  - `No blocked tasks`
  - `No pending human tasks`
  - `No stale claims`
- Apply the empty-state behavior consistently to all dashboard sections, not just blocked tasks.
- Keep the dashboard output capped by the existing widget line limit.

## Notes
The earlier wording “export” refers to the Pi dashboard/widget output, not a file export.
- 2026-05-24T18:35:17Z [pi-agent:dashboard-empty] note: Implemented dashboard empty-state handling by checking JSON output for each section, displaying section-specific messages for empty sections, and preserving colored non-empty command output in the shared widget. Updated dashboard test coverage.
- 2026-05-24T18:35:31Z [pi-agent:dashboard-empty] note: Verification passed: npm test (7 tests) and npm run check. Dashboard now emits explicit empty messages: No ready tasks, No in-progress tasks, No blocked tasks, No pending human tasks, No stale claims as applicable.
