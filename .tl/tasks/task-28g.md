---
id: task-28g
title: Add CLI compatibility guidance to /tl-init
status: done
priority: medium
type: task
created_at: 2026-06-03T16:53:55Z
updated_at: 2026-09-08T18:04:21Z
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
references:
  - extensions/tl/commands.ts
  - extensions/tl/cli.ts
  - features/tl-init-compatibility.feature
  - README.md
---

## Description

Improve /tl-init using the shared CLI detection and version utilities.

Accepted closing scope:
- Check whether the tl CLI can run. If unavailable, provide official manual installation/repair guidance and do not attempt initialization.
- Compare the detected version against MIN_TL_VERSION. Warn with upgrade guidance for older versions, but do not block confirmed initialization.
- Warn when version compatibility cannot be verified without claiming the CLI is incompatible.
- Recognize upstream TAG-COMMIT_COUNT-COMMIT_HASH builds against their base release; retain warnings for genuine prereleases below the minimum.
- Perform compatibility checks even when .tl/ already exists, without reinitializing an existing ledger.
- Confirm creation of .tl/ before running tl init; report execution failures without false success or overlay refresh.
- Document behavior and verify with BDD, unit tests, and CLI smoke tests.

Scope decision: the original proposed automatic npm installation is excluded. The named tl-taskledger package returns E404. Manual official installation guidance is the delivered alternative; the user confirmed the flow works and requested closure.

## Notes

- 2026-09-08T17:48:11Z [pi-agent] note: User approved adding the non-blocking compatibility warning. Registry verification npm view tl-taskledger name version repository.url bin --json returned E404 on 2026-09-08: the task-specified automatic npm installer cannot work and will not be implemented against an unverified substitute. Implementing the warning/detection/init portion now, with manual official installation guidance when CLI cannot run; leave automatic-install scope pending a valid source/human decision. Version comparison follows SemVer: release-floor prereleases are below the stable minimum, build metadata ignored, newer core versions supported. Existing-ledger /tl-init invocations should still report version issues without reinitializing.
- 2026-09-08T17:53:04Z [pi-agent] note: Implemented the user-approved compatibility portion. New BDD feature came first (baseline 5 failing/4 passing scenarios; new unit baseline 22 failing/3 passing). Added isTlVersionCompatible using validated SemVer components and stable MIN_TL_VERSION, preserving correct numeric ordering (0.10 > 0.9), prerelease precedence and build metadata handling. /tl-init now probes availability, warns with detected/minimum version and official upgrade URL for older versions, warns for unknown version, then preserves confirmation and existing-ledger skip. Missing/unrunnable CLI gets manual official guidance, no unverified npm installer. Corrected confirmation path to .tl/ and handled spawn/killed/failed init without false success or refresh. README documents exact behavior. Warnings are on /tl-init, not startup/footer recoloring (task-fvv is separate).
- 2026-09-08T17:53:04Z [pi-agent] note: Verification: npm run check and all 256 current node:test cases pass, including concurrent board work left untouched. Targeted @tl-init or @tl-cli BDD passes 16 scenarios/61 steps. Full BDD has 31 passing scenarios/128 steps and only the pre-existing task-gbi gap (5 undefined scenarios/26 steps); Node v26.7.0 untested-version warning remains. Real tl 0.9.0-0-db9cd9b smoke in a temporary directory warns as a prerelease below stable 0.9.0, initializes only after confirmation, and skips reinitialization on a second invocation. Temporary ledger cleaned up. git diff --check passes. No software installed, settings changed, screenshot work, or commits made. Automatic npm installation is the sole remaining scope item; npm registry returns E404 for the task-specified tl-taskledger package.
- 2026-09-08T17:59:07Z [pi-agent] note: Correction to earlier SemVer interpretation: task-d4u verifies upstream tl Makefile generates TAG-COMMIT_COUNT-COMMIT_HASH, not prerelease identifiers. Compatibility now accepts 0.9.0-0-db9cd9b and other supported-release Git builds without warning, while actual 0.9.0-rc.1 and older-release builds still warn. This supersedes the earlier smoke-test expectation for the local Git build. Installer-source decision remains pending and unchanged.
- 2026-09-08T18:04:21Z [pi-agent] resolved: User confirmed the delivered /tl-init flow works, then requested "close work". Closing on the delivered scope: manual official installation guidance instead of the unavailable tl-taskledger npm installer. No automatic installation is included.
- 2026-09-08T18:04:21Z [pi-agent] note: Closed at user request after successful manual retest. Delivered CLI compatibility/init guidance is complete, including task-d4u Git build suffix correction. Prior test results remain recorded above; full BDD gap remains independently tracked in task-gbi. Original automatic npm installer scope removed in favor of delivered manual guidance. No new code edits, Git commits, pushes, or changes to unrelated tasks during closure.
