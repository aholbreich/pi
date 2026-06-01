# @aholbreich/pi-tl

Pi extension package for [`tl`](https://github.com/aholbreich/tl), the Git-native TaskLedger CLI.

This package shells out to the local `tl` binary. It does not bundle or install `tl`.

## Requirements

- `pi`
- `tl` available on `PATH`
- Run Pi from a repository initialized with `tl init` for normal use

## Try locally

From any repository where you want to use TaskLedger:

```sh
pi -e /home/aho/git/pi-tl
```

Or install the local package globally in Pi:

```sh
pi install /home/aho/git/pi-tl
```

For project-local installation, run from the project and add `-l`:

```sh
pi install -l /home/aho/git/pi-tl
```

## Tools

The extension registers these tools for the agent, aligned with `tl version 0.6.x`:

- `tl_ready` - list dependency-ready tasks using `tl ready --json`
- `tl_list` - list tasks with common filters
- `tl_show` - show one task in detail
- `tl_history` - show task or ledger event history
- `tl_create` - create a task
- `tl_bulk_create` - create multiple tasks sequentially from an approved list
- `tl_refine` - update editable task fields
- `tl_claim` - claim or heartbeat a task lease
- `tl_release` - voluntarily release a claim
- `tl_note` - append progress/handoff notes
- `tl_close` - close a completed task
- `tl_block` / `tl_unblock` - block or unblock a task
- `tl_cancel` - cancel a task with a reason
- `tl_pending` / `tl_resolve` - ask/answer a human-input question
- `tl_stale` - list tasks with expired claims
- `tl_dep_add` / `tl_dep_remove` - manage dependency links

When `.taskledger/` exists in the current repository, the extension also nudges the agent to use the task ledger workflow: ready → claim → note → close/block/pending/cancel/release.

## Commands

A live Task Ledger overlay is shown above the editor when the current repository has a ledger and at least one ready/in-progress/blocked/pending/stale task. It keeps `tl` as the source of truth by refreshing from `tl --json` output on session start, compaction/tree navigation, and successful `tl_*` tool executions. Use `Alt+T` to show/hide this passive overlay during the current session. The footer status shows the installed `tl` version plus compact colored counts, for example `tl 0.6.0: ○3 ▲1`.

Human-facing commands focus on the overlay workflow. Agent tools keep color disabled for clean JSON/model output.

- `/tl-capture` - open an editor for rough todos, then ask the agent to refine and create clean tasks
- `/tl-board` or `Alt+L` - open a keyboard-navigable modal board for ready, in-progress, blocked, pending, and stale tasks; use arrows/j/k to move, enter/d for in-modal details, b/esc to return, i/r/v/p for implement/refine/review/plan, and `a` to toggle between focused (active) and all (including done/cancelled) views
- `/tl-init` - initialize task ledger after confirmation

## Development

```sh
npm install
npm run check
npm test
```

Pi loads TypeScript extensions directly, so no build step is required.
