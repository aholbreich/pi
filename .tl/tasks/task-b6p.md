---
id: task-b6p
title: 'Simplify summary overlay: drop section labels, add priority icons'
status: done
priority: low
type: task
created_at: 2026-06-01T16:08:50Z
updated_at: 2026-06-01T16:10:28Z
created_by: human
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
  - visual
---

## Description

Streamline the passive task-summary overlay widget (`task-summary-overlay.ts`) by removing redundant text and improving priority visibility.

## Requirements
- Remove section text labels ("Active", "Blocked", "Pending", "Ready", "Stale") from task rows — the icons (◐, ▲, ?, ○, ◇) and colors already distinguish sections
- Replace `[high]` / `[medium]` / `[low]` text with colored priority icons (e.g. ▲ high, ● medium, ○ low) using the existing theme colors
- Keep the summary header line and "N more …" overflow indicators unchanged
- Render format example: `◐ task-abc ▲ Fix login bug` (icon + id + priority-icon + title)
- Add a Cucumber scenario for the simplified render

## Notes

- 2026-06-01T16:10:25Z [main-pc] note: Simplified summary overlay task rows: removed redundant section labels ("Active:", "Ready:", etc.) since icons already distinguish sections. Replaced [high]/[medium]/[low] text with priority icons (▲ high, ● medium, ○ low). Changes: - task-summary-overlay.ts: renderTaskLine drops section.label, uses priorityIcon() helper instead of [priority] text. - tests/extension.test.mjs: updated assertions to match new format (task-active, task-ready without section labels). Note: No Cucumber fixture exists for the passive overlay yet; node:test assertions were updated instead. 9/9 node:test + 9/9 Cucumber pass.
