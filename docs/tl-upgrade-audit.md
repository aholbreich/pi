# tl upgrade audit

Date: 2026-06-01

## Scope

Review upstream [`aholbreich/tl`](https://github.com/aholbreich/tl) changes newer than the extension's documented target and identify relevant adoption work for this Pi extension.

## Current state

- This extension shells out to the user's local `tl` binary; it does not bundle `tl`.
- `README.md` still says the registered tools are aligned with `tl version 0.6.x`.
- Local installed CLI observed during this audit: `tl version 0.8.1-3-31161d5`.
- Latest upstream release observed: `0.9.0` (`tl 0.9.0`, published 2026-05-31).
- Upstream changelog points to GitHub Releases; release notes for 0.7/0.8 are terse, so this audit also reviewed the local upstream git history and diffs.

## Upstream changes relevant to this extension

### 0.7.x

- Added one-step shell completion installation and task ID autocompletion.
- Added/expanded task `references` support and `tl refine --add-ref/--remove-ref`.
- Reworked docs: command reference moved into `docs/usage.md` and comparison docs.

Relevance:
- The extension now asks agents to use the `tl` CLI directly for normal operations, so no wrapper is needed for reference refinement; agents can use `tl refine --add-ref/--remove-ref` directly.
- No extension change is needed for shell completion, except documentation may mention it as an install/use tip.

### 0.8.x / 0.8.1

- Added `tl doctor [--json] [--fix] [--force]` for ledger integrity diagnostics and repairs.
- Added `tl agents --write-files`, `--dry-run`, and later `--compact` workflow output.
- Removed the bare root create shortcut; scripts should use explicit `tl create`.

Relevance:
- The extension has no `/tl-doctor` command, but agents can run `tl doctor` directly via the CLI when needed.
- The repository already uses compact workflow guidance in `AGENTS.md`; README and extension docs can be updated to target 0.8/0.9 rather than 0.6.
- Existing extension task creation uses explicit `tl create`, so the removed shortcut is not a breaking issue.

### 0.9.0

Release notes list:
- `tl remove` command for mistaken tasks.
- Compact agents workflow guide.
- Doctor repair for concatenated event journal lines.
- Release workflow/changelog polish.

Important command behavior:
- `tl remove TASK_ID -m REASON [--force]` requires a reason.
- By default, remove only succeeds for cancelled, unclaimed, dependency-free tasks.
- Removing non-cancelled, claimed, or depended-on tasks requires `--force`.
- A `removed` event with the reason is recorded before the task file disappears from the active ledger.

Relevance:
- `/tl-board` exposes a remove action and now passes a user-provided remove reason (`-m/--message`). A future enhancement may add a deliberate `--force` path for non-cancelled tasks.
- No agent-callable `tl_remove` wrapper is needed; agents can run `tl remove` directly.
- The existing `tl history` behavior is improved upstream for removed tasks: history can still resolve via event journal even when the task file no longer exists.

## Compatibility and breaking-change assessment

- **Low breaking risk for existing tools:** current read/list/create/lifecycle commands continue to exist.
- **Resolved board integration gap:** `tl remove` requires `-m/--message`; `/tl-board` now collects and passes a reason.
- **Resolved documentation drift:** README no longer claims broad `tl_*` wrapper alignment and now documents the intentional direct-CLI model.
- **Reduced schema drift risk:** the extension no longer attempts to mirror most `tl` commands as agent tools.

## Recommendations

### 1. Keep normal agent operations on the `tl` CLI — completed

The extension should not mirror `tl ready`, `tl show`, `tl claim`, `tl close`, etc. as Pi tools. Agents can use the CLI directly, and the extension should only keep helpers that add orchestration beyond one CLI command.

Current retained helper:

- `tl_bulk_create` for user-approved batch creation with partial-failure reporting.

### 2. Consider `/tl-doctor` as a human-facing UX command — medium priority, medium effort

A slash command could provide a safe UI around:

```sh
tl doctor --json
tl doctor --fix
tl doctor --fix --force
```

Use conservative UX: diagnostics are safe; repairs should require explicit confirmation, and destructive `--force` should be clearly labeled. Agents can already run `tl doctor` directly without a wrapper.

Estimated effort: medium (command UX + tests).

### 3. Add install notes — low priority, small effort

A future docs pass can mention `tl completion --install` and `tl agents --compact` as available upstream conveniences.

Estimated effort: small.

## Suggested adoption order

1. Keep only `tl_bulk_create` as an agent helper.
2. Consider a human-facing `/tl-doctor` command.
3. Add install-note docs for `tl completion --install` and `tl agents --compact`.

This keeps current UI behavior working while avoiding a second, drifting wrapper surface for the `tl` CLI.
