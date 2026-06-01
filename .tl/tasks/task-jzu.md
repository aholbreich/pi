---
id: task-jzu
title: Board title truncated too early in /tl-board overlay
status: open
priority: medium
type: bug
created_at: 2026-06-01T20:02:03Z
updated_at: 2026-06-01T20:02:03Z
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
  - board
---

## Description

The board overlay title bar (borderTop) truncates the centered task ID title too aggressively at the 80-column overlay width. The title text space is calculated as width-2 then fitPlain-capped, leaving insufficient room for readable title + task ID. Fix: widen the title area or shorten the title format.
