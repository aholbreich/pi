---
id: task-p7e
title: Board shows stale task data after cancel/remove and re-open (reopened)
status: done
priority: high
type: bug
created_at: 2026-06-03T17:48:38Z
updated_at: 2026-06-03T17:49:21Z
created_by: human
assignee: null
depends_on: []
claim:
  actor: null
  claimed_at: null
  expires_at: null
  heartbeat_at: null
tags:
  - board
  - lifecycle
---

## Notes

- 2026-06-03T17:49:21Z [pi-agent] note: Second attempt: replaced signal:undefined with new AbortController().signal. The undefined signal may have been treated as 'aborted' by pi.exec, causing it to skip execution. A fresh never-aborted AbortController ensures pi.exec actually runs the commands. All tests pass.
