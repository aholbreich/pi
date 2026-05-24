---
id: task-knj
title: Review Task Ledger extension architecture after command cleanup
status: done
priority: medium
type: task
created_at: 2026-05-24T19:23:00Z
updated_at: 2026-05-24T20:02:16Z
created_by: pi-agent:tl-capture
assignee: null
depends_on:
  - task-4m7
  - task-t6b
claim:
  actor: null
  claimed_at: null
  expires_at: null
  heartbeat_at: null
tags:
  - extension
  - architecture
  - modularization
  - cleanup
---

## Description

After removing legacy user commands, review the extension architecture for modularization opportunities. Focus on simplifying command registration, separating board/overlay/tool concerns, removing unused helpers, and improving maintainability without changing user-facing behavior. Depends on the /tl-ready and /tl-show removal tasks.

## Notes

- 2026-05-24T20:02:12Z [pi-agent:tl-arch-cleanup] note: Reviewed and cleaned up architecture after command removals. Simplified board action model by removing unused 'show' selection path (details are handled inside board), changed board component to store only task entries instead of unused section line records, and extracted workflow/capture prompt construction into extensions/tl/prompts.ts so commands.ts focuses on registration/routing. Verification passed: npm test (9 tests) and npm run check.
