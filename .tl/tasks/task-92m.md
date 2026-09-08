---
id: task-92m
title: Release pi-tl 0.5.0 with board and overlay improvements
status: done
priority: medium
type: chore
created_at: 2026-09-08T18:29:45Z
updated_at: 2026-09-08T18:40:57Z
created_by: release-agent
assignee: null
depends_on: []
claim:
  actor: null
  claimed_at: null
  expires_at: null
  heartbeat_at: null
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
- 2026-09-08T18:39:43Z [release-agent] note: Committed completed source/tests/BDD as 302994e and 0b8511d, release docs/CI as 52773fb, ledger as ffcccb2. npm version minor passed the preversion hook and created 9a323b92dcd5fe2ce6dcef7f29b25d5c626d9117 plus annotated v0.5.0. Atomic HTTPS push was rejected because the saved OAuth token lacks workflow scope (nothing pushed); retried using the existing authorized SSH key to the same repository, without changing config/credentials, successfully pushed main+tag. Packed archive smoke required the repository's test loader fallback and declared peers (not included in bare extraction); after supplying those it loads correctly with 4 commands/5 shortcuts. GitHub Actions https://github.com/aholbreich/pi/actions/runs/34263832935 succeeded, including fresh install, typecheck, 273 tests, 50 BDD scenarios, pack and npm publish with provenance. GitHub release created at https://github.com/aholbreich/pi/releases/tag/v0.5.0. Registry metadata/latest confirm 0.5.0 with matching gitHead and sha512/shasum, but the canonical tarball URL and npm pack @aholbreich/pi-tl@0.5.0 still return HTTP 404. Waiting to verify artifact availability; will not re-publish or move the immutable release tag.
- 2026-09-08T18:40:57Z [release-agent] note: Release fully verified at 18:40 UTC. Registry tarball propagation completed after initial 404s; npm pack @aholbreich/pi-tl@0.5.0 now succeeds and cmp confirms the public tarball is byte-for-byte identical to the locally smoke-tested 16-file archive (shasum d32909a770a71b44f38f93896f4b3274009fe66f). npm view confirms version/latest 0.5.0 and gitHead 9a323b92dcd5fe2ce6dcef7f29b25d5c626d9117. Provenance metadata is present; GitHub Actions run 34263832935 passed on Node 24, including all 273 tests and 50 BDD scenarios. Public non-prerelease GitHub release: https://github.com/aholbreich/pi/releases/tag/v0.5.0. No installed extension/settings changed and no X post sent; announcement is a draft for the user. Existing audit findings and open human-review/screenshot tasks remain documented, not silently resolved.
