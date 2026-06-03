---
id: task-zxq
title: Add semver version determination script and npm version hook
status: in_progress
priority: medium
type: task
created_at: 2026-06-03T17:19:48Z
updated_at: 2026-06-03T17:20:13Z
created_by: human
assignee: null
depends_on: []
claim:
  actor: pi-agent
  claimed_at: 2026-06-03T17:20:13Z
  expires_at: 2026-06-03T18:20:13Z
  heartbeat_at: 2026-06-03T17:20:13Z
tags:
  - release
  - semver
  - script
---

## Description

Add lightweight semver tooling that complements the existing `.github/workflows/publish.yml` (publishes to npm on `v*` tag push):

1. **`scripts/determine-version.js`** — Reads `git log` since last `v*` tag, parses conventional commit prefixes (`feat:`, `fix:`, `feat!:`, `BREAKING CHANGE:`), outputs the recommended semver bump type (major/minor/patch). No dependencies — uses only `node:child_process` to shell out to `git log`.

2. **`package.json` `scripts.version`** — npm lifecycle hook that runs before `npm version`. Validates we're on the `main` branch and working tree is clean. Prevents accidental version bumps on feature branches or with uncommitted changes.

Output example:
```
$ npm run release:dry
Commits since v0.2.3:
  feat: wrap long task titles …
  fix: overlay refresh after board lifecycle
  refactoring: tests
Recommended bump: minor (1 feat, 1 fix)
```
