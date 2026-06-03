---
id: task-w2k
title: Add tl binary detection and version compatibility check
status: open
priority: medium
type: task
created_at: 2026-06-03T16:53:55Z
updated_at: 2026-06-03T16:53:55Z
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
  - cli
  - version
---

## Description

Add shared utilities in `cli.ts` to detect whether the `tl` binary exists on PATH and parse its version. Hardcode a `MIN_TL_VERSION` constant (use the current tl version as the floor). Refactor the overlay's `ensureVersionLabel` in `task-summary-overlay.ts` to reuse the new version utility instead of duplicating the `tl --version` call.

Functions to add:
- `isTlAvailable(pi, ctx): Promise<boolean>` — runs `tl --version` with a short timeout (2s), returns true on success
- `getTlVersion(pi, ctx): Promise<string | null>` — returns parsed version string or null
- `MIN_TL_VERSION` — hardcoded semver string for minimum supported version
