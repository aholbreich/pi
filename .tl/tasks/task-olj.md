---
id: task-olj
title: Document semver release workflow as tl task template
status: done
priority: medium
type: task
created_at: 2026-06-03T17:19:48Z
updated_at: 2026-06-03T17:24:26Z
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
  - docs
  - workflow
---

## Description

Document the release process so humans and agents can follow it via a tl task checklist. Create `docs/release-workflow.md` with:

1. When to bump (any merge to main with conventional commits)
2. How to determine bump type: `npm run release:dry`
3. How to release: `npm version <patch|minor|major>` (bumps package.json + creates tag)
4. How to publish: `git push --follow-tags` (triggers `.github/workflows/publish.yml` → npm)
5. Verification: check npm registry, test install

Also add a `release` task template as a comment block in the doc that can be copied into a tl task body when creating a release task. Ensure the existing publish.yml workflow is referenced as the automation layer — the new process is the human-facing decision layer.
