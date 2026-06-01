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
- The extension already asks agents to inspect references, but `tl_refine` cannot add/remove references yet.
- No extension change is needed for shell completion, except documentation may mention it as an install/use tip.

### 0.8.x / 0.8.1

- Added `tl doctor [--json] [--fix] [--force]` for ledger integrity diagnostics and repairs.
- Added `tl agents --write-files`, `--dry-run`, and later `--compact` workflow output.
- Removed the bare root create shortcut; scripts should use explicit `tl create`.

Relevance:
- The extension has no `tl_doctor` tool or `/tl-doctor` command, so users cannot easily diagnose ledger corruption from Pi.
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
- `/tl-board` now exposes a remove action, but the current implementation should pass a remove reason (`-m/--message`) and may need a force path for non-cancelled tasks.
- The extension has no agent-callable `tl_remove` tool yet.
- The existing `tl_history` behavior is improved upstream for removed tasks: history can still resolve via event journal even when the task file no longer exists.

## Compatibility and breaking-change assessment

- **Low breaking risk for existing tools:** current read/list/create/lifecycle commands continue to exist.
- **One observed integration gap:** `tl remove` requires `-m/--message`; integrations that call remove without a reason will fail with exit code 2.
- **Documentation drift:** README claims 0.6.x alignment, while implemented behavior and local CLI are already beyond that.
- **Schema drift:** task references are part of current task metadata, but the extension exposes only coarse refine fields.

## Recommendations

### 1. Fix `/tl-board` remove command reason handling — high priority, small effort

When the user presses `x`, collect a reason (similar to cancel) and run:

```sh
tl remove <id> -m "<reason>"
```

Consider a second confirmation or explicit option for `--force`, but default should remain safe and non-force.

Estimated effort: small (BDD scenario + one callback change + tests).

### 2. Add `tl_remove` agent tool — medium priority, small effort

Expose the upstream remove command to agents with parameters:

- `id` (required)
- `message` (required)
- `actor` (optional)
- `force` (optional, documented as destructive)

Estimated effort: small (tool registration + tests/documentation).

### 3. Add `tl_doctor` support — medium priority, medium effort

Add an agent tool and possibly a slash command for:

```sh
tl doctor --json
tl doctor --fix
tl doctor --fix --force
```

Use conservative UX: diagnostics are safe; repairs should require explicit confirmation, and destructive `--force` should be clearly labeled.

Estimated effort: medium (tool + command UX + tests).

### 4. Extend `tl_refine` for references — medium priority, small effort

Add optional `addRefs` / `removeRefs` arrays that map to `--add-ref` and `--remove-ref`.

Estimated effort: small.

### 5. Update README target version and install notes — low priority, small effort

Change the README alignment statement from `tl version 0.6.x` to `tl version 0.9.x` once the remove/doctor gaps are handled. Mention `tl completion --install` and `tl agents --compact` as available upstream conveniences.

Estimated effort: small.

## Suggested adoption order

1. Fix board remove reason handling.
2. Add `tl_remove` tool.
3. Add `tl_doctor` diagnostics.
4. Extend `tl_refine` references.
5. Update README compatibility statement to 0.9.x.

This keeps current UI behavior working first, then exposes newer upstream capabilities to agents, then finishes documentation alignment.
