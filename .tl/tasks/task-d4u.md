---
id: task-d4u
title: Recognize tl Git build suffixes in compatibility checks
status: done
priority: medium
type: bug
created_at: 2026-09-08T17:56:22Z
updated_at: 2026-09-08T18:03:31Z
created_by: pi-agent
assignee: null
depends_on: []
claim:
  actor: null
  claimed_at: null
  expires_at: null
  heartbeat_at: null
tags:
  - cli
  - version
references:
  - extensions/tl/cli.ts
  - features/tl-init-compatibility.feature
  - https://github.com/aholbreich/tl/blob/main/Makefile
  - features/tl-git-build-compatibility.feature
  - tests/init-compatibility.test.mjs
  - README.md
---

## Description

User reports a false older-version warning for tl 0.9.0-0-db9cd9b. Upstream Makefile stamps builds as VERSION-COUNT-COMMIT_HASH, where VERSION is the latest tag and COUNT counts commits since it. Recognize this specific build suffix for compatibility rather than treating it as a SemVer prerelease. Preserve the full display version. Builds based on 0.9.0 or newer meet the 0.9.0 floor; genuine prereleases such as 0.9.0-rc.1 and builds based on older releases remain below it. Add BDD and unit regressions, update README, and verify real CLI behavior. Do not alter the pending installer decision in task-28g.

## Notes

- 2026-09-08T17:59:07Z [pi-agent] note: Fixed false compatibility warning by recognizing the verified upstream TAG-COMMIT_COUNT-COMMIT_HASH format. For equal-to-minimum core versions, only a numeric count plus hexadecimal hash is treated as release build provenance; genuine rc/beta prereleases remain below the stable floor, and an older core remains unsupported regardless of commit count. Full detected version remains unchanged for display. Updated README and added BDD first: 3 failing/4 passing regression scenarios before fix. Verification: npm run check passes, all 263 node:test cases pass, 23 CLI/init BDD scenarios/89 steps pass. Full BDD: 38 scenarios/156 steps pass, with only existing task-gbi gap (5 undefined scenarios/26 steps). Real CLI detection preserves 0.9.0-0-db9cd9b, now reports compatible, and /tl-init fixture using that exact version initializes without a warning. git diff --check passes. No unrelated edits, installations or commits.
- 2026-09-08T18:03:31Z [pi-agent] note: User confirmed the /tl-init fix works after retesting. Automatic installer decision under task-28g remains pending; this confirmation does not change that scope.
