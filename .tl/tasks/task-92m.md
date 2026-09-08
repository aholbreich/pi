---
id: task-92m
title: Release pi-tl 0.5.0 with board and overlay improvements
status: in_progress
priority: medium
type: chore
created_at: 2026-09-08T18:29:45Z
updated_at: 2026-09-08T18:32:00Z
created_by: release-agent
assignee: null
depends_on: []
claim:
  actor: release-agent
  claimed_at: 2026-09-08T18:29:51Z
  expires_at: 2026-09-08T19:29:51Z
  heartbeat_at: 2026-09-08T18:29:51Z
tags:
  - release
  - npm
references:
  - docs/release-workflow.md
  - .github/workflows/publish.yml
  - package.json
---

## Description

User requested committing current completed work, making a proper release, and drafting an X announcement. Review pending changes without claiming completion of the open human-review/screenshot tasks, align minimal release documentation, run typecheck/unit/BDD/package verification, commit completed work and ledger state, use npm version minor plus tag-triggered GitHub Actions publishing, create GitHub release notes, and verify npm version/latest/gitHead. Do not post the X draft or update the user's installed extension.

## Notes

- 2026-09-08T18:32:00Z [release-agent] note: Release review: no other active task claims; completed compatibility/init/status/legend work is ready to commit alongside the already-committed board scrolling/wrapping/summary fixes. release:dry recommends minor 0.5.0. Added minimal README corrections for Alt+p, nested legend, compatibility footer, cached detection, and board summaries; publish CI now runs test:all including BDD. Fresh npm ci, npm run check, npm run test:all pass (273 unit tests, 50 scenarios/209 BDD steps); git diff --check passes. npm pack --dry-run contains only LICENSE/README/package.json and extension sources (16 files, no ledger/tests/node_modules bundled). package-lock.json is unchanged from v0.4.0: npm audit reports 6 existing dev-tree findings (5 high, 1 low) involving pi-coding-agent, brace-expansion, protobufjs, undici, ws, esbuild; no automatic dependency upgrades performed. tl doctor has existing warnings for historical missing task files hcs/jzu/wsj and missing type on k4d; no ledger repairs applied. Human review task-ccv and screenshot refresh task-mlt remain open.
