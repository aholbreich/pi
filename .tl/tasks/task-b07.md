---
id: task-b07
title: Board shows stale task data after cancel/remove and re-open
status: open
priority: high
type: bug
created_at: 2026-06-03T17:24:45Z
updated_at: 2026-06-03T17:24:45Z
created_by: human
assignee: null
depends_on: []
claim:
  actor: null
  claimed_at: null
  expires_at: null
  heartbeat_at: null
tags:
  - board
  - lifecycle
---

## Description

## Steps to reproduce

1. Alt+L to open the Task Ledger Board
2. Navigate to a task, press Enter to open details
3. Press x (remove) or c (cancel)
4. Confirm the action, enter a reason
5. Observe: the board re-opens but the removed/cancelled task is still visible

## Observed behavior

The board correctly closes during the lifecycle flow and re-appears afterward, but the task that was just removed/cancelled is still displayed in the board. This suggests the data loaded on re-open is stale.

## Suspected cause

After the lifecycle command (\`tl remove\` / \`tl cancel\`) completes, the loop calls \`openTaskLedgerBoard(pi, ctx)\` which runs \`loadBoardSections(pi, ctx)\`. This calls \`runTl(pi, ctx, args)\` for each section, which delegates to \`pi.exec("tl", fullArgs, { signal: ctx.signal })\`.

Possible causes:
1. **ctx.signal is aborted**: After the first overlay closes (via \`done()\`), the signal tied to \`ctx\` may be in an aborted state, causing \`pi.exec\` to return empty/stale results instead of executing fresh commands.
2. **pi.exec caching**: Pi's exec layer may cache identical command results within the same turn/session, returning the pre-removal data.
3. **Race condition**: The \`tl remove\` filesystem write hasn't flushed before the re-open queries execute (unlikely given async/await ordering).

## Affected code

- \`extensions/tl/commands.ts\`: \`openBoardAndHandleSelection()\` — reuses the same \`ctx\` object across loop iterations
- \`extensions/tl/board.ts\`: \`loadBoardSections()\` — calls \`runTl(pi, ctx, args)\` with the shared \`ctx\`

## Potential fix

Call \`loadBoardSections\` with a fresh signal, or verify that \`pi.exec\` is actually executing the commands on re-open rather than returning cached results.
