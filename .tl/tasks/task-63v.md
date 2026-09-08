---
id: task-63v
title: Generate release notes from commit history with a single npm script
status: done
priority: medium
type: chore
created_at: 2026-06-03T20:42:10Z
updated_at: 2026-09-08T17:19:57Z
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

## Notes

- 2026-09-08T17:19:57Z [agent-name] note: Implemented release-notes generator. Changes: - scripts/release-notes.js: zero-dependency Node ESM script that reads git log since the last tag, groups commits by conventional-commit type (feat/fix/perf/refactor/docs/chore/…), surfaces BREAKING CHANGE entries, and renders Markdown to stdout or a file (-o/--file). - package.json: added "release-notes": "node scripts/release-notes.js". - README.md: documented npm run release-notes (stdout + -o file usage) under Development. - docs/release-workflow.md: added a generate-notes step and a row in the how-it-works table. Approach note: chose a small zero-dep script over auto-changelog/conventional-changelog to match the existing scripts/determine-version.js convention and avoid heavyweight devDependencies (per AC 'no new heavyweight dependencies unless justifiable'). BDD note: skipped a Gherkin feature — this is developer tooling (a release pipeline helper), not user-facing product behavior; no UI/domain surface to specify. Verification: - npm run check (tsc --noEmit): pass. - node --test tests/*.test.mjs: 187 pass, 0 fail. - Manual runs: (1) current repo prints 'Changes since v0.4.0' with a Chores section; (2) temp fixture repo with feat/fix/feat!/docs/unprefixed commits groups correctly and orders Breaking Changes first; (3) -o notes.md writes the same Markdown to file. All exit 0.
