---
id: task-8cr
title: 'Spike: Gherkin BDD with TypeScript feasibility'
status: done
priority: low
type: task
created_at: 2026-06-01T14:53:33Z
updated_at: 2026-06-01T15:19:18Z
created_by: human
assignee: null
depends_on: []
claim:
  actor: null
  claimed_at: null
  expires_at: null
  heartbeat_at: null
tags:
  - testing
  - bdd
  - typescript
  - research
---

## Description

Research how Gherkin-based BDD (Behavior-Driven Development) could be integrated with TypeScript in this project. Evaluate tooling options (e.g., Cucumber.js with ts-node, Playwright + Cucumber, jest-cucumber), compatibility with the existing test setup, and effort required. Produce a short recommendation doc covering approach, tooling, and trade-offs.

## Notes

- 2026-06-01T15:04:31Z [main-pc] note: Completed feasibility spike. Wrote recommendation doc at docs/bdd-feasibility.md. Evaluated 5 options against the project's current setup (Node --test runner, zero framework deps, TypeScript/ESM). Recommended: @cucumber/cucumber + tsx — full Gherkin support, works with ESM/TypeScript, ~20 transitive deps, separate runner so existing tests unchanged. Alternative: stay with node --test + BDD-style test naming (zero effort, zero risk). Not recommended: jest-cucumber (requires Jest migration), Playwright/Cypress-based solutions (browser-focused, massive deps), custom wrapper (high implementation effort).
- 2026-06-01T15:19:18Z [main-pc] note: Implemented @cucumber/cucumber + tsx for Gherkin BDD with TypeScript. Deliverables: - cucumber.mjs — Cucumber config (tsx/esm transpilation, features/glob) - features/tl-board.feature — 8 scenarios covering board navigation, details, actions, shortcuts - features/step-definitions/tl-board.steps.ts — step definitions using Cucumber World pattern, integrating with existing extension loader via jiti - package.json — scripts: test:bdd / test:all Results: 8/8 scenarios (31/31 steps) pass. Existing node:test suite (9/9 tests) unchanged. TypeScript compiles cleanly.
