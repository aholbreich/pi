---
id: task-gbi
title: Complete missing title-wrapping BDD step definitions
status: done
priority: medium
type: chore
created_at: 2026-09-08T10:29:32Z
updated_at: 2026-09-08T18:07:57Z
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
  - features/task-title-wrap.feature
  - features/step-definitions/tl-board.steps.ts
  - task-s45
  - features/step-definitions/task-title-wrap.steps.ts
  - README.md
---

## Description

Baseline npm run test:all on fresh checkout 03f8f8a has 5 undefined scenarios / 26 undefined steps in features/task-title-wrap.feature. Implement the missing step definitions so existing title-wrapping acceptance coverage actually executes. Observed while fixing board dependency visibility under task-s45; not caused by that change. Unit tests pass. A separate stale nav/navigate assertion in the board BDD was corrected as part of that work.

## Notes

- 2026-09-08T18:05:41Z [pi-agent] note: Reviewed referenced feature/board step definitions and task-s45 history. The five title-wrap scenarios already exist and are the BDD-first specification; no duplicate feature needed. Will add isolated title-wrap step definitions exercising real board loading/rendering/navigation with deterministic task data and marked theme styling, without editing production rendering or shared board World. Preserve all existing scenarios; add a tag for targeted runs. Assertions will cover full title reconstruction, word boundaries, indentation, prefix uniqueness, selected title styling, and scrolling through more than eight multiline entries. Remove README known-gap notice only once full suite passes.
- 2026-09-08T18:07:57Z [pi-agent] note: Completed all missing title-wrap steps in isolated features/step-definitions/task-title-wrap.steps.ts, preserving the five existing scenarios and adding @title-wrap for targeted runs. Uses real openTaskLedgerBoard loading/classification/component rendering against deterministic JSON fixtures, a marked theme, one short title and nine long titles. Checks full text and whole-word preservation, no ellipsis, continuation indentation/prefix uniqueness, selected accent/bold styling, and observable navigation/window ranges through ten mixed-height entries including boundary clamping. Does not read private scroll state or replace the shared World. No production code or existing shared board steps changed. Removed README obsolete known-gap notice while retaining pre-existing README edits.
- 2026-09-08T18:07:57Z [pi-agent] note: Verification: baseline full BDD reproduced 5 undefined scenarios/26 steps. Green targeted @title-wrap: 5 scenarios/26 steps. npm run check and npm run test:all pass: 266 node:test cases and all 47 BDD scenarios/196 steps. Full randomized BDD order (seed 31415) also passes. Explicit strict TypeScript check of the new step-definition file passes (project tsconfig normally only checks extensions). Mutation checks on disposable copies caught all four regressions: title truncation, shifted continuation indent, lost continuation selection styling, and row-based scrolling. Temporary copies removed; production files untouched. git diff --check passes. Only Cucumber untested Node v26.7.0 advisory remains. No installation, settings, Git commit or unrelated task changes.
