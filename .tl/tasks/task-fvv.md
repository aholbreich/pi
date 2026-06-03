---
id: task-fvv
title: Color-coded tl version status with shortened label
status: open
priority: medium
type: task
created_at: 2026-06-03T18:11:53Z
updated_at: 2026-06-03T18:11:53Z
created_by: human
assignee: null
depends_on:
  - task-w2k
claim:
  actor: null
  claimed_at: null
  expires_at: null
  heartbeat_at: null
tags:
  - extension
  - overlay
  - ux
  - status
---

## Description

Replace the current tl version x.y.z status line with a shortened tl x.y.z label and color-coded states:

States:
- tl binary not on PATH: red color, text 'tl: not found'
- tl found, incompatible version: warning/yellow, text 'tl x.y.z: incompatible'
- tl found, compatible, no .tl/ dir: dim/gray, text 'tl x.y.z: no ledger'
- tl found, compatible, initialized: green/success, text 'tl x.y.z: ○3 ◐1 ...'

Also shorten the version label from 'tl version x.y.z' to just 'tl x.y.z'. The version detection should distinguish tl-not-found from version-incompatible so the red state can be shown. Depends on task-w2k for isTlAvailable/getTlVersion/MIN_TL_VERSION utilities.
