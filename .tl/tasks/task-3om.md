---
id: task-3om
title: Verify pi-tl tools against installed tl CLI version
status: done
priority: medium
type: task
created_at: 2026-05-24T17:10:33Z
updated_at: 2026-05-24T17:13:55Z
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
  - compatibility
---

## Description

Inspect installed tl version/help, verify extension tool commands still match the current tl CLI (0.6.x), update the extension if command flags changed, and run type checks/tests.

## Notes

- 2026-05-24T17:13:54Z [pi-agent:verify-tl-compat] note: Inspected installed tl at /home/aho/bin/tl: version 0.6.0-0-ee4a993. Added extension tools for 0.6.x commands: history, refine, release, block/unblock, cancel, pending/resolve, stale, dep add/remove. Verified npm run check, JSON command smoke tests, and extension registration via jiti mock (18 tools, 2 slash commands).
