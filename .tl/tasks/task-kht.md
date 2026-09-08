---
id: task-kht
title: Release pi-tl with complete board task visibility
status: done
priority: medium
type: chore
created_at: 2026-09-08T10:53:44Z
updated_at: 2026-09-08T10:55:18Z
created_by: codex
assignee: null
depends_on: []
claim:
  actor: null
  claimed_at: null
  expires_at: null
  heartbeat_at: null
tags: []
references:
  - task-s45
  - .github/workflows/publish.yml
  - scripts/pre-version.js
  - scripts/determine-version.js
---

## Description

User requested pushing the local board fix and releasing a new npm version. Commit verified changes, push main, follow repository npm version/tag-driven GitHub Actions publishing process, and verify published package and release. Existing full-BDD undefined scenarios remain tracked under task-gbi; release workflow gates on typecheck and unit tests.

## Notes

- 2026-09-08T10:54:05Z [codex] note: Release checks pass: npm run check, 181 unit tests, npm pack --dry-run, git diff --check. origin/main unchanged after fetch. Existing unreleased feat(tl) column-based footer since v0.3.1 requires minor bump (0.4.0); publishing follows tag-triggered GitHub Actions OIDC workflow. Full BDD known gaps remain task-gbi, no release gates bypassed.
- 2026-09-08T10:55:18Z [codex] note: Released successfully. Fix commit d4dcab5 pushed to main; npm version minor created release commit d3ffeca and tag v0.4.0, atomically pushed. GitHub Actions run https://github.com/aholbreich/pi/actions/runs/34217880807 passed all publishing gates and npm publish. Registry confirms @aholbreich/pi-tl version/latest 0.4.0 with gitHead d3ffecacd8d19e22cfb1d77c33cb3d32e25e3dc3. GitHub release: https://github.com/aholbreich/pi/releases/tag/v0.4.0. Installed local npm extension unchanged; user can run pi update npm:@aholbreich/pi-tl and /reload.
