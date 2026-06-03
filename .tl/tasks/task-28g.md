---
id: task-28g
title: Guided tl install via npm and improved /tl-init flow
status: open
priority: medium
type: task
created_at: 2026-06-03T16:53:55Z
updated_at: 2026-06-03T16:53:55Z
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
  - cli
  - init
  - ux
---

## Description

Update the `/tl-init` command handler in `commands.ts` with a guided flow:

1. Check if `tl` binary is available (use `isTlAvailable` from task 1)
2. If not found, show a prompt: "`tl` CLI not found on PATH. pi-tl requires the task ledger CLI. Install it via npm?" → if approved, run `npm install -g tl-taskledger` via `pi.exec`, then retry detection
3. Check `tl --version` against `MIN_TL_VERSION` — if too old, notify with upgrade suggestion but don't block
4. Check if `.tl/` already exists → skip init
5. Confirm with user → run `tl init` as before

Prefer npm since pi itself is distributed via npm.
