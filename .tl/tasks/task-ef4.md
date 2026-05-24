---
id: task-ef4
title: Add Alt+T toggle for passive Task Ledger overlay
status: done
priority: high
type: task
created_at: 2026-05-24T19:42:07Z
updated_at: 2026-05-24T19:43:34Z
created_by: pi-agent:tl-overlay-toggle
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
  - keyboard
  - overlay
---

## Description

Add a keyboard shortcut Alt+T to show/hide the passive always-visible Task Ledger overlay widget above the editor. Keep Alt+L for the interactive board modal. Hidden state should survive overlay refreshes during the current session, and toggling should notify the user. Update README and tests.

## Notes

- 2026-05-24T19:43:30Z [pi-agent:tl-overlay-toggle] note: Implemented Alt+T shortcut to toggle the passive Task Ledger overlay. Overlay hidden state survives refreshes in the current session; toggling emits notifications. Alt+L remains the interactive board shortcut. README and tests updated. Verification passed: npm test (10 tests) and npm run check.
