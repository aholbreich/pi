---
id: task-w2k
title: Add tl binary detection and version compatibility check
status: done
priority: medium
type: task
created_at: 2026-06-03T16:53:55Z
updated_at: 2026-09-08T17:45:37Z
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
references:
  - extensions/tl/cli.ts
  - extensions/tl/task-summary-overlay.ts
  - features/tl-cli-detection.feature
---

## Description

Add shared utilities in `cli.ts` to detect whether the `tl` binary exists on PATH and parse its version. Hardcode a `MIN_TL_VERSION` constant (use the current tl version as the floor). Refactor the overlay's `ensureVersionLabel` in `task-summary-overlay.ts` to reuse the new version utility instead of duplicating the `tl --version` call.

Functions to add:
- `isTlAvailable(pi, ctx): Promise<boolean>` — runs `tl --version` with a short timeout (2s), returns true on success
- `getTlVersion(pi, ctx): Promise<string | null>` — returns parsed version string or null
- `MIN_TL_VERSION` — hardcoded semver string for minimum supported version

## Notes

- 2026-09-08T17:40:44Z [pi-agent] note: Scope: add the two requested detection/version helpers and MIN_TL_VERSION, then reuse getTlVersion in the overlay without adding install prompts or compatibility warnings (those belong to dependent task-28g). Use 0.9.0 as the stable floor; current local CLI reports tl version 0.9.0-0-db9cd9b. Preserve prerelease/build suffixes in parsed versions. Availability means the version command completed successfully, independently of whether its output is parseable. Both probes use a 2-second timeout and degrade to false/null on execution failure. Pre-existing board.ts and board-component.test.mjs changes will remain untouched.
- 2026-09-08T17:45:37Z [pi-agent] note: BDD first: added features/tl-cli-detection.feature and isolated step definitions; baseline red had 5 failing / 2 passing new scenarios (missing helpers and unknown-version footer fallback). Added helper unit cases and overlay integration tests. Implemented one shared color-free 2-second version probe, isTlAvailable, strict semantic getTlVersion parsing (optional CLI/v prefixes, prerelease/build preservation), and MIN_TL_VERSION=0.9.0. Failure/nonzero/killed probes return false/null. Overlay now uses getTlVersion and retains cached labels/plain tl fallback, with no duplicate availability probe. No compatibility enforcement or installer UI added; task-28g can consume the utilities.
- 2026-09-08T17:45:37Z [pi-agent] note: Verified: npm run check passes; all 228 current node:test cases pass (includes concurrent board work, left untouched). New targeted BDD: npm run test:bdd -- --tags @tl-cli passes 7 scenarios/25 steps. Full BDD: 20 scenarios/82 steps pass; only existing task-gbi title-wrap gap remains (5 undefined scenarios/26 undefined steps). Cucumber warns Node v26.7.0 is untested. Real CLI smoke via execFile adapter confirms available=true and exact parsed 0.9.0-0-db9cd9b; isolated empty-PATH probe confirms false/null without changing machine PATH. git diff --check passes. Added tests cover missing executable, rejected timeout, nonzero exit, killed process, missing exit code, unknown/malformed versions, suffixes, context/signal/timeout forwarding, uncached utility retries, cached overlay labels and noninteractive no-probe behavior. Unrelated board changes and task-z41 ledger activity were not edited.
