---
id: task-zxq
title: Add semver version determination script and npm version hook
status: done
priority: medium
type: task
created_at: 2026-06-03T17:19:48Z
updated_at: 2026-06-03T17:22:15Z
created_by: human
assignee: null
depends_on: []
claim:
  actor: null
  claimed_at: null
  expires_at: null
  heartbeat_at: null
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

## Notes

- 2026-06-03T17:22:15Z [pi-agent] note: Implemented: (1) scripts/determine-version.js — reads git log since last v* tag, parses conventional commits (feat:/fix:/BREAKING CHANGE:), recommends bump type. No dependencies. (2) package.json release:dry script alias. (3) package.json version lifecycle hook — validates clean tree on main branch before allowing npm version. Tested: correctly recommends minor bump for current commits, blocks on dirty tree.
