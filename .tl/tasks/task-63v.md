---
id: task-63v
title: Generate release notes from commit history with a single npm script
status: open
priority: medium
type: chore
created_at: 2026-06-03T20:42:10Z
updated_at: 2026-06-03T20:42:10Z
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
  - npm
  - docs
---

## Description

Add an npm script (e.g. `npm run release-notes`) that generates release notes from the git commit history since the last tag.

Scope:
- Use a lightweight approach — prefer a bundled tool (e.g. auto-changelog, conventional-changelog) over a custom script, unless a simple one-liner suffices.
- Output to a file or stdout, suitable for GitHub releases or changelog entries.
- Group commits by conventional-commit type (feat, fix, chore, …) if the tool supports it.
- Keep it simple: one `npm run <script>` invocation produces the notes.

Acceptance criteria:
- Running the script produces a clean, readable markdown list of changes since the most recent git tag.
- The script is documented in the README or package.json scripts comment.
- No new heavyweight dependencies unless justifiable.
