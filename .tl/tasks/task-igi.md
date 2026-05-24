---
id: task-igi
title: Show tl version and compact task counts in footer status
status: done
priority: medium
type: task
created_at: 2026-05-24T19:27:15Z
updated_at: 2026-05-24T20:14:21Z
created_by: pi-agent:tl-capture
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
  - statusline
  - overlay
---

## Description

Replace the static footer status text currently showing `tl` with a compact, colored Task Ledger footer summary. Include the installed `tl` CLI version as a trimmed prefix, for example `tl 0.4.0-xxx:`. After the version, show short task counts using compact labels or icons rather than long words, e.g. `3 r · 1 b` or a clearer icon-based equivalent. Counts should include ready, in-progress/active, blocked, pending-human, and stale when non-zero, with zero-work/no-ledger states handled cleanly. Reuse the same tl JSON data already loaded for the passive overlay where practical, and refresh the footer alongside overlay refreshes after session start, tree/compact, and successful `tl_*` tool execution. Update tests and README if user-visible behavior changes.

## Notes

- 2026-05-24T20:14:13Z [pi-agent:tl-statusline] note: Implemented compact footer status from overlay data. Overlay refresh now fetches and caches `tl --version`, trims `tl version ...` to `tl ...`, and updates footer status with compact colored counts (○ ready, ◐ active, ▲ blocked, ? pending, ◇ stale), plus no-ledger/zero-work/error states. README and tests updated. Verification passed: npm test (9 tests) and npm run check. Note: accidentally ran `tl version` while checking CLI behavior, which created task-k4d; immediately cancelled it with an explanatory note.
