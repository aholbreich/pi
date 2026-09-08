---
id: task-fvv
title: Color-coded tl status line with availability and compatibility states
status: done
priority: medium
type: task
created_at: 2026-06-03T18:11:53Z
updated_at: 2026-09-08T18:04:04Z
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
references:
  - extensions/tl/cli.ts
  - extensions/tl/task-summary-overlay.ts
---

## Description

Replace the overlay's current single-dim status label with color-coded footer states in `task-summary-overlay.ts`.

The version label is already shortened to `tl x.y.z` (ensureVersionLabel reuses `getTlVersion`), so this task only adds the state/color logic.

States (footer "pi-tl" status line):
- tl binary not on PATH: error/red, text `tl: not found`
- tl found, incompatible version: warning/yellow, text `tl x.y.z: incompatible`
- tl found, compatible, no `.tl/` dir: dim, text `tl x.y.z: no ledger`
- tl found, compatible, initialized: success/green, text `tl x.y.z: ○3 ◐1 …`

Reuse the cli.ts utilities delivered by task-w2k:
- `isTlAvailable(pi, ctx)` — distinguishes not-found from a found-but-incompatible binary
- `getTlVersion(pi, ctx)` — parsed version for the label
- `isTlVersionCompatible(version)` + `MIN_TL_VERSION` — the incompatible state

Precedence: not-found > incompatible > (no-ledger if no `.tl/`, otherwise initialized counts).

## Acceptance criteria

- Each of the four states renders the exact text and theme color above.
- Not-found (red) is distinguished from incompatible (yellow).
- The shortened `tl x.y.z` label is preserved (do not regress).
- Existing per-section count colors and the error/empty fallbacks are unchanged.

## Notes

- 2026-09-08T18:04:04Z [agent-name] note: Implemented color-coded footer status states in task-summary-overlay.ts. Changes: - ensureVersionLabel -> ensureVersionState: probes isTlAvailable, then getTlVersion, and classifies into not-found / incompatible / compatible using isTlVersionCompatible + MIN_TL_VERSION from cli.ts. - refresh() now short-circuits by state: not-found -> error 'tl: not found' + hide; incompatible -> warning 'tl x.y.z: incompatible' + hide; compatible+no .tl -> dim 'tl x.y.z: no ledger' + hide; compatible+initialized -> load snapshot. - updateStatus() colors the initialized label prefix green/success; counts keep their per-section colors; empty '0r' (dim) and error '!' (error) fallbacks unchanged. - Precedence: not-found > incompatible > (no-ledger if no .tl/, else initialized counts). Tests: - tests/overlay-version.test.mjs: rewritten to assert the four states with color tags (stable/git-build compatible, prerelease/too-old/unknown incompatible, failed/missing not-found) plus a green-label initialized case; probe counts (1 vs 2) verified. - tests/extension.test.mjs: updated Alt+T toggle mock (adds --version) and session-start overlay test to a compatible 1.0.0 (calls 6->7, status label). - BDD: new features/tl-overlay-status.feature + steps (4 scenarios); updated tl-cli-detection.feature 'unknown version' scenario to expect 'tl: incompatible'. Verification: - npm run check (tsc): pass. - node --test tests/*.test.mjs: 266 pass, 0 fail. - cucumber-js: 42 passed, 0 failed, 5 undefined (pre-existing task-title-wrap.feature gap, task-gbi).
