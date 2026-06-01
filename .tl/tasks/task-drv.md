---
id: task-drv
title: 'Research: Audit latest tl changes and propose upgrades'
status: done
priority: low
type: task
created_at: 2026-06-01T14:53:33Z
updated_at: 2026-06-01T18:00:01Z
created_by: human
assignee: null
depends_on: []
claim:
  actor: null
  claimed_at: null
  expires_at: null
  heartbeat_at: null
tags:
  - tl
  - research
  - maintenance
---

## Description

Review the latest Task Ledger release notes, changelog, and any upstream changes since the current pinned version. Identify new features, breaking changes, bug fixes, and improvements relevant to this project. Produce a brief summary with recommendations for which changes to adopt and an estimated effort level.

## Notes

- 2026-06-01T17:59:53Z [main-pc] note: Completed tl upstream audit and wrote docs/tl-upgrade-audit.md. Findings: - Current README still documents alignment with tl 0.6.x; local CLI observed as 0.8.1-3-31161d5; latest upstream release observed as 0.9.0. - Audited upstream release notes and local git diffs/logs for 0.7.x, 0.8.x, 0.8.1, and 0.9.0. - Key relevant changes: references/refine add/remove refs, shell completion, doctor diagnostics/repair, agents compact/write-files/file targeting, remove command with required reason, event journal separator/doctor fixes, history for removed tasks. - Document recommends adoption order: fix board remove reason handling, add tl_remove tool, add tl_doctor support, extend tl_refine refs, update README compatibility/install notes. Verification: npm run test:all passed (10 node tests, 12 Cucumber scenarios, 50 steps).
