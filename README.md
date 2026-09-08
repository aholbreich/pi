# @aholbreich/pi-tl

Pi extension package for [`tl`](https://github.com/aholbreich/tl), the Git-native TaskLedger CLI.

This package shells out to the local `tl` binary. It does not bundle or install `tl`.

![Task Ledger modal board showing active and closed tasks](docs/images/tl-board.png)

*Example board in All view (earlier layout). See [Commands](#commands) for current controls.*

## Requirements

- [Pi](https://pi.dev) installed and configured with a model/provider
- `tl` 0.9.0 or newer installed separately and available on `PATH` — see [tl installation options](https://github.com/aholbreich/tl#installation-options)
- Start Pi in the repository root containing `.tl/`; the extension does not search parent directories for a ledger

## Installation

```sh
pi install npm:@aholbreich/pi-tl
```

This installs the extension for your user, not the `tl` CLI.

For project-local installation, run this from the target repository with `-l`:

```sh
pi install -l npm:@aholbreich/pi-tl
```

### Initialize a repository

After installing Pi, `tl`, and the extension:

```sh
cd /absolute/path/to/your-project
tl --version                    # confirm the CLI is on PATH
tl init                         # once per repository; creates .tl/
pi
```

Alternatively, start Pi in the repository root and use `/tl-init` to initialize after confirmation. Restart Pi or run `/reload` if you installed the extension during an existing session. Accept Pi's project trust prompt for project-local packages only in repositories you trust.

`/tl-init` checks the CLI even when a ledger already exists. Versions below 0.9.0 receive an upgrade warning; unknown versions receive a compatibility warning. Neither warning blocks initialization, which still requires confirmation. A genuine prerelease such as `0.9.0-rc.1` is below the stable minimum. The CLI's Git build suffix (`0.9.0-0-db9cd9b`, meaning tag, commit count, and hash) is checked against its base release; build metadata does not affect compatibility. If the CLI cannot run, the command provides installation guidance rather than installing software automatically.

Use `/tl-capture` to collect your first tasks, then `/tl-board` to browse them. An empty ledger has no task summary to display.

## Try locally

Clone this repository to work with local sources:

```sh
git clone https://github.com/aholbreich/pi.git pi-tl
cd pi-tl
npm ci
```

From the target repository root, load that checkout for one run without adding it to Pi settings:

```sh
pi -e /absolute/path/to/pi-tl
```

Replace `/absolute/path/to/pi-tl` with your checkout path. To keep loading the checkout in future sessions, use `pi install /absolute/path/to/pi-tl` instead. Avoid also loading an installed npm copy when testing local changes.

## Agent usage

The extension intentionally does **not** mirror the full `tl` CLI as Pi agent tools. The agent should use plain `tl ...` commands directly for normal ledger work (`tl ready`, `tl show`, `tl claim`, `tl note`, `tl close`, etc.). This keeps the extension from drifting behind upstream `tl`.

One helper remains because it adds orchestration beyond a single CLI call:

- `tl_bulk_create` - create multiple task ledger tasks sequentially from a user-approved cleaned list and report partial failures.

When `.tl/` exists in the current repository, the extension nudges the agent to use the normal task ledger workflow through the `tl` CLI: ready → claim → note → close/block/pending/cancel/release.

## Commands

The board and summary overlay are interactive-terminal features. Agent tools keep color disabled for clean JSON/model output.

- `/tl-capture [rough todos]` - open an editor, then ask the agent to refine the captured todos into tasks; task creation requires approval
- `/tl-triage` - ask the agent to review duplicates, gaps, stale work, and missing dependencies; propose changes without applying them until approved
- `/tl-board` or `Alt+L` - open the keyboard-navigable modal board
- `/tl-init` - run the separately installed `tl init` after confirmation

### Summary overlay

A compact Task Ledger summary appears above the editor when the `tl` CLI is compatible, `.tl/` exists, and there is ready, in-progress, blocked, pending, or stale work. The footer shows the installed `tl` version and colored counts, for example `tl 0.9.0: ○3 ▲1` (three ready, one blocked).

If the CLI cannot run, the footer shows red `tl: not found`; an incompatible or unrecognized version produces a yellow `incompatible` warning instead of a task summary. A compatible CLI without `.tl/` shows dim `no ledger`. CLI detection is cached for the session: use `/reload` after installing or upgrading `tl`.

The summary refreshes from `tl` JSON output on session start/reload, after every agent turn (including CLI calls and `tl_bulk_create`), after compaction/tree navigation, and after successful initialization or board cancel/remove actions. It does not watch external ledger edits continuously; hide and show it to refresh while idle.

- `Alt+T` - hide/show the summary during the current session; showing it refreshes the snapshot
- `Alt+I` - claim the first Ready task in the cached summary, then ask the agent to implement it
- `Alt+R` - ask the agent to refine that first Ready task without claiming it
- `Alt+P` - ask the agent to plan that first Ready task without claiming it

The dim `↳ Alt: i implement · r refine · p plan` legend is nested beneath the Ready task these shortcuts target. The quick actions notify you if no Ready task is cached. They target the first Ready task, not the board selection or an earlier Pending/Active task.

### Board controls

| Key | Action |
| --- | --- |
| `↑`/`↓` or `k`/`j` | Move through the list, or scroll the task details |
| `Enter` or `d` | Open selected task details (`tl show`) |
| `Esc` or `q` | Return from details to the list; close from the list |
| `b` | Return from details to the list |
| `a` | Toggle Focused/All in the list |
| `i` / `r` / `v` / `p` | Ask the agent to implement / refine / review / plan the selected task |
| `c` / `x` | In details only: cancel / remove after confirmation and a reason prompt |

Removing a task deletes it from the active ledger; cancel it instead to retain it as Cancelled. The board reopens after cancel/remove. Workflow actions close the board and send a request to the agent (queued as a follow-up if it is busy).

The board's **Waiting** (`◌`) section keeps open tasks that are not ready
(including tasks waiting on prerequisites) visible in both views. This is
separate from explicitly **Blocked** tasks. Open a task's details with `enter`
or `d` to inspect its **Depends On** information.

**All** uses the complete `tl list --all --json` inventory, including
Done/Cancelled and any unrecognized statuses under **Other**. Each task appears
once; stale claims take precedence over other non-closed sections. The passive
overlay remains a compact actionable summary, not the full board inventory.
The board normally opens in **Focused** view (excluding Done/Cancelled), but
opens in **All** when there is at most one focused task and additional closed tasks.

The board summary counts all sections, including zero counts and Done/Cancelled, independently of the Focused/All list toggle. When space is limited, middle sections are elided to keep the closed-task counts visible where they fit. Task details wrap to the view width and can be scrolled with `↑`/`↓` or `k`/`j`.

## Development

Run these from the extension checkout with Node.js and npm installed:

```sh
npm ci
npm run check       # TypeScript check
npm test            # unit/integration tests via node:test
npm run test:bdd    # Cucumber features
# npm run test:all  # node:test followed by Cucumber
```

Behavior specifications live in `features/`; follow the [Gherkin guidelines](docs/gherkin-guidelines.md) when changing behavior.

Generate Markdown release notes from commits since the last tag:

```sh
npm run release-notes                 # print to stdout
npm run release-notes -- -o NOTES.md  # write to a file
```

See [Release workflow](docs/release-workflow.md) for versioning and publishing.

Pi loads TypeScript extensions directly, so no build step is required. Restart your local test session after changing the extension.
