---
id: task-sny
title: Nest overlay action legend beneath its target task
status: done
priority: medium
type: bug
created_at: 2026-09-08T18:25:00Z
updated_at: 2026-09-08T18:27:19Z
created_by: agent-name
assignee: null
depends_on: []
claim:
  actor: null
  claimed_at: null
  expires_at: null
  heartbeat_at: null
tags:
  - overlay
  - ux
  - shortcuts
references:
  - extensions/tl/task-summary-overlay.ts
  - tests/overlay-render.test.mjs
  - features/overlay-action-target.feature
  - features/step-definitions/overlay-action-target.steps.ts
---

## Description

Follow-up to task-lfr, reported with a screenshot: the Alt legend uses the same tree branch as tasks, so it reads as a separate entry rather than actions for the preceding Ready task.

Acceptance criteria:
- Render the dim legend indented beneath the first visible Ready task, with a subordinate arrow instead of a sibling task branch.
- Preserve the outer tree connector when subsequent tasks follow, and close the last task branch correctly when the legend is last.
- Attach after the complete wrapped target row; show only one legend and none without a visible Ready target.
- Preserve width/line limits and existing Alt+i/r/p targeting. Do not add selection/navigation.
- Add regression coverage reproducing one Pending and two Ready tasks from the screenshot.

## Notes

- 2026-09-08T18:27:19Z [agent-name] note: Fixed the task-lfr visual regression: the Alt legend is now a dim subordinate line with a five-column indent and ↳ marker. Keep the outer │ only when a rendered task/overflow branch follows; put the closing └─ on the final task branch, not the legend. Attach after the target's full wrapped title. No shortcut, focus, selection, or task-target behavior changed. BDD first: screenshot and last-target scenarios failed on the sibling-style legend (2 failing, 1 passing), then all 3 passed after the fix. Added six unit regressions for the screenshot, wrapped target, later section/overflow, line-cap closure, hidden target, and dim/narrow rendering; updated the old last-line assertion to check the task branch. Verified npm run check, git diff --check, and npm run test:all: 273 unit tests and 50 BDD scenarios / 209 steps passed. Left existing shared working-tree changes untouched; no commit made.
