---
id: task-d1o
title: Verify README accuracy and clarify setup and usage
status: done
priority: medium
type: chore
created_at: 2026-06-01T19:57:16Z
updated_at: 2026-09-08T17:38:09Z
created_by: human
assignee: null
depends_on: []
claim:
  actor: null
  claimed_at: null
  expires_at: null
  heartbeat_at: null
tags:
  - docs
  - readme
references:
  - README.md
---

## Description

Audit `README.md` against current extension behavior, package scripts, and relevant Pi/tl documentation. Make focused corrections for first-time users; avoid a broad rewrite.

Scope:
- Verify prerequisites, installation, initialization, and local-development instructions.
- Replace machine-specific paths with clear, consistent examples.
- Verify commands, shortcuts, board/overlay behavior, and agent-tool guidance.
- Check screenshot context and developer workflow instructions.
- Keep implementation README-only; track screenshot replacement or code fixes separately if needed. If screenshots are needed and cannot be produced by the agent, ask the user to provide them.

Acceptance criteria:
- Documented commands and behavior agree with their authoritative sources.
- Setup examples clearly distinguish installing the extension, installing `tl`, and initializing a ledger.
- Local-path examples are portable and consistent.
- Screenshot context and development instructions are accurate.
- Available relevant checks are run, with results and verification limitations recorded in the task.

## Notes

- 2026-09-08T17:38:09Z [pi-agent] note: Implemented README-only audit: separate Pi/tl/extension setup, root-only .tl detection, portable checkout paths, first-task flow, missing /tl-triage and Alt+I/Alt+R, accurate turn-end refresh semantics, details-only lifecycle actions, scrolling and focused/all behavior, BDD/development and release links. Reviewed source, package scripts, installed Pi 0.85.1 README/packages/extensions docs and example, upstream tl checkout README, and local tl 0.9.0 CLI help. Existing screenshot retained as an explicitly labeled earlier-layout illustration; no replacement image or code changes made. Non-blocking code finding: /tl-init confirmation in extensions/tl/commands.ts incorrectly says .taskledger/; existing task-28g is the relevant init-flow follow-up.
- 2026-09-08T17:38:09Z [pi-agent] note: Verification: npm run check passes; npm test 187/187 passes; npm run test:bdd has 13 passing board scenarios/57 steps and the pre-existing 5 undefined title-wrap scenarios/26 steps (task-gbi), documented in README. Cucumber warns Node v26.7.0 is untested. Tried positional feature selection; current Cucumber merges configured paths, so removed that misleading targeted-test suggestion. git diff --check passes; all local Markdown targets exist; shell code blocks pass bash -n; external Pi/tl/project URLs return HTTP 200; release-notes stdout command works. No Markdown lint script configured. Installation commands verified against documentation/manifests rather than rerunning installs or changing Pi settings; no fresh interactive screenshot captured. No new behavior or feature files for this documentation-only task.
