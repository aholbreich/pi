---
id: task-kht
title: Release pi-tl with complete board task visibility
status: in_progress
priority: medium
type: chore
created_at: 2026-09-08T10:53:44Z
updated_at: 2026-09-08T10:54:05Z
created_by: codex
assignee: null
depends_on: []
claim:
  actor: codex
  claimed_at: 2026-09-08T10:53:50Z
  expires_at: 2026-09-08T11:53:50Z
  heartbeat_at: 2026-09-08T10:53:50Z
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
