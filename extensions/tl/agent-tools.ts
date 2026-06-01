import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { addBoolean, addOptional, addPositional, addTags } from "./args.js";
import { runTl, runTlTool } from "./cli.js";
import { IdParam, Priority } from "./schemas.js";

/**
 * Register LLM-callable task ledger tools.
 *
 * These are agent tools — Pi exposes them to the model so the agent can call
 * tl_ready, tl_claim, etc. They are distinct from user-facing slash commands
 * registered in commands.ts.
 *
 * Most tools delegate to runTlTool(), which shells out to the tl CLI, parses
 * JSON output, and wraps the result into a model-consumable { content: [...] }
 * format. The exception is tl_bulk_create (see its registration comment).
 */
export function registerTlTools(pi: ExtensionAPI): void {
	// ── Query tools — read-only task lookups ──

	pi.registerTool({
		name: "tl_ready",
		label: "tl:ready",
		description: "List task ledger tasks that are ready to be claimed in the current repository.",
		promptSnippet: "List dependency-ready task ledger tasks from tl ready --json",
		promptGuidelines: [
			"Use tl_ready before selecting queued repository work; use tl_claim before starting a chosen task, tl_note for progress or handoff context, and tl_close only after verification.",
		],
		parameters: Type.Object({
			tag: Type.Optional(Type.String({ description: "Only show ready tasks with this tag" })),
		}),
		async execute(_toolCallId, params, signal, _onUpdate, ctx) {
			const args = ["ready", "--json"];
			addOptional(args, "--tag", params.tag);
			return runTlTool(pi, { cwd: ctx.cwd, signal }, args, { parseJson: true });
		},
	});

	pi.registerTool({
		name: "tl_list",
		label: "tl:list",
		description: "List task ledger tasks in the current repository.",
		promptSnippet: "List task ledger tasks with filters",
		parameters: Type.Object({
			all: Type.Optional(Type.Boolean({ description: "Include closed tasks" })),
			status: Type.Optional(Type.String({ description: "Filter by status, e.g. open, in_progress, blocked, pending_human, done, cancelled" })),
			tag: Type.Optional(Type.String({ description: "Filter by tag" })),
			claimedBy: Type.Optional(Type.String({ description: "Filter by claiming actor" })),
			mine: Type.Optional(Type.Boolean({ description: "Shortcut for tasks claimed by the resolved actor" })),
		}),
		async execute(_toolCallId, params, signal, _onUpdate, ctx) {
			const args = ["list", "--json"];
			addBoolean(args, "--all", params.all);
			addOptional(args, "--status", params.status);
			addOptional(args, "--tag", params.tag);
			addOptional(args, "--claimed-by", params.claimedBy);
			addBoolean(args, "--mine", params.mine);
			return runTlTool(pi, { cwd: ctx.cwd, signal }, args, { parseJson: true });
		},
	});

	pi.registerTool({
		name: "tl_show",
		label: "tl:show",
		description: "Show a task ledger task in detail.",
		promptSnippet: "Show a task ledger task by id",
		parameters: Type.Object(IdParam),
		async execute(_toolCallId, params, signal, _onUpdate, ctx) {
			return runTlTool(pi, { cwd: ctx.cwd, signal }, ["show", params.id, "--json"], { parseJson: true });
		},
	});

	pi.registerTool({
		name: "tl_history",
		label: "tl:history",
		description: "Show task ledger event history for one task or recent ledger activity.",
		promptSnippet: "Show task or ledger event history from tl history --json",
		parameters: Type.Object({
			id: Type.Optional(Type.String({ description: "Optional task id, e.g. task-k5g or bare short code k5g" })),
			since: Type.Optional(Type.String({ description: "Only show events within this duration, e.g. 24h or 7d" })),
		}),
		async execute(_toolCallId, params, signal, _onUpdate, ctx) {
			const args = ["history"];
			addPositional(args, params.id);
			args.push("--json");
			addOptional(args, "--since", params.since);
			return runTlTool(pi, { cwd: ctx.cwd, signal }, args, { parseJson: true });
		},
	});

	// ── CRUD tools — create / update tasks ──

	pi.registerTool({
		name: "tl_create",
		label: "tl:create",
		description: "Create a new task in the current repository.",
		promptSnippet: "Create a new task ledger task",
		parameters: Type.Object({
			title: Type.String({ description: "Task title" }),
			description: Type.Optional(Type.String({ description: "Markdown task description" })),
			priority: Type.Optional(Priority),
			type: Type.Optional(Type.String({ description: "Task type, e.g. task, bug, chore" })),
			tags: Type.Optional(Type.Array(Type.String(), { description: "Tags to apply" })),
			actor: Type.Optional(Type.String({ description: "Creator actor; omit for tl default" })),
		}),
		async execute(_toolCallId, params, signal, _onUpdate, ctx) {
			const args = ["create", "--title", params.title, "--json"];
			addOptional(args, "--description", params.description);
			addOptional(args, "--priority", params.priority);
			addOptional(args, "--type", params.type);
			addOptional(args, "--actor", params.actor);
			addTags(args, params.tags);
			return runTlTool(pi, { cwd: ctx.cwd, signal }, args, { parseJson: true });
		},
	});

	// tl_bulk_create composes multiple tl create calls and builds a summary report.
	// It uses runTl() directly instead of runTlTool() because it needs to aggregate
	// individual call results and set isError when any task fails.
	pi.registerTool({
		name: "tl_bulk_create",
		label: "tl:bulk:create",
		description: "Create multiple task ledger tasks sequentially with one tool call.",
		promptSnippet: "Create multiple task ledger tasks from a cleaned list",
		promptGuidelines: [
			"Use tl_bulk_create only after the user has approved a cleaned list of multiple tasks; for one task, use tl_create.",
		],
		parameters: Type.Object({
			actor: Type.Optional(Type.String({ description: "Creator actor for all tasks; omit for tl default" })),
			tasks: Type.Array(
				Type.Object({
					title: Type.String({ description: "Task title" }),
					description: Type.Optional(Type.String({ description: "Markdown task description" })),
					priority: Type.Optional(Priority),
					type: Type.Optional(Type.String({ description: "Task type, e.g. task, bug, chore" })),
					tags: Type.Optional(Type.Array(Type.String(), { description: "Tags to apply" })),
				}),
				{ description: "Tasks to create sequentially" },
			),
		}),
		async execute(_toolCallId, params, signal, _onUpdate, ctx) {
			const created: unknown[] = [];
			const failed: Array<Record<string, unknown>> = [];

			for (const [index, task] of params.tasks.entries()) {
				const args = ["create", "--title", task.title, "--json"];
				addOptional(args, "--description", task.description);
				addOptional(args, "--priority", task.priority);
				addOptional(args, "--type", task.type);
				addOptional(args, "--actor", params.actor);
				addTags(args, task.tags);

				const run = await runTl(pi, { cwd: ctx.cwd, signal }, args, { parseJson: true });
				if (run.exitCode === 0) {
					created.push(run.json ?? run.stdout.trim());
					continue;
				}

				failed.push({
					index,
					title: task.title,
					exitCode: run.exitCode,
					stdout: run.stdout,
					stderr: run.stderr,
				});
			}

			const lines = [`Created ${created.length}/${params.tasks.length} task(s).`];
			if (created.length > 0) {
				lines.push(
					"Created:\n" +
						created
							.map((task) => {
								if (task && typeof task === "object" && "id" in task && "title" in task) {
									return `- ${String(task.id)} ${String(task.title)}`;
								}
								return `- ${JSON.stringify(task)}`;
							})
							.join("\n"),
				);
			}
			if (failed.length > 0) {
				lines.push(
					"Failed:\n" + failed.map((failure) => `- #${failure.index}: ${failure.title} (exit ${failure.exitCode})`).join("\n"),
				);
			}

			return {
				content: [{ type: "text", text: lines.join("\n\n") }],
				details: { created, failed },
				isError: failed.length > 0,
			};
		},
	});

	pi.registerTool({
		name: "tl_refine",
		label: "tl:refine",
		description: "Update editable fields of an existing task ledger task.",
		promptSnippet: "Update task title, description, priority, or type",
		parameters: Type.Object({
			...IdParam,
			title: Type.Optional(Type.String({ description: "New task title" })),
			description: Type.Optional(Type.String({ description: "New task description" })),
			priority: Type.Optional(Priority),
			type: Type.Optional(Type.String({ description: "New task type" })),
		}),
		async execute(_toolCallId, params, signal, _onUpdate, ctx) {
			const args = ["refine", params.id, "--json"];
			addOptional(args, "--title", params.title);
			addOptional(args, "--description", params.description);
			addOptional(args, "--priority", params.priority);
			addOptional(args, "--type", params.type);
			return runTlTool(pi, { cwd: ctx.cwd, signal }, args, { parseJson: true });
		},
	});

	// ── Lifecycle tools — claim, workflow state transitions ──

	pi.registerTool({
		name: "tl_claim",
		label: "tl:claim",
		description: "Claim or heartbeat a task ledger task with a lease.",
		promptSnippet: "Claim a ready task ledger task",
		parameters: Type.Object({
			...IdParam,
			ttl: Type.Optional(Type.String({ description: "Lease duration, e.g. 60m or 2h" })),
			actor: Type.Optional(Type.String({ description: "Claiming actor; omit for tl auto-resolution" })),
			force: Type.Optional(Type.Boolean({ description: "Take over an active claim held by another actor" })),
		}),
		async execute(_toolCallId, params, signal, _onUpdate, ctx) {
			const args = ["claim", params.id, "--json"];
			addOptional(args, "--ttl", params.ttl);
			addOptional(args, "--actor", params.actor);
			addBoolean(args, "--force", params.force);
			return runTlTool(pi, { cwd: ctx.cwd, signal }, args, { parseJson: true });
		},
	});

	pi.registerTool({
		name: "tl_release",
		label: "tl:release",
		description: "Voluntarily release a claim on a task ledger task.",
		promptSnippet: "Release a task claim when handing off or stepping away",
		parameters: Type.Object({
			...IdParam,
			actor: Type.Optional(Type.String({ description: "Releasing actor; omit for tl auto-resolution" })),
			force: Type.Optional(Type.Boolean({ description: "Release even when another actor holds the claim" })),
		}),
		async execute(_toolCallId, params, signal, _onUpdate, ctx) {
			const args = ["release", params.id, "--json"];
			addOptional(args, "--actor", params.actor);
			addBoolean(args, "--force", params.force);
			return runTlTool(pi, { cwd: ctx.cwd, signal }, args, { parseJson: true });
		},
	});

	pi.registerTool({
		name: "tl_note",
		label: "tl:note",
		description: "Append a progress or handoff note to a task ledger task.",
		promptSnippet: "Append a note to a task ledger task",
		parameters: Type.Object({
			...IdParam,
			message: Type.String({ description: "Note body" }),
			actor: Type.Optional(Type.String({ description: "Note actor; omit for tl auto-resolution" })),
		}),
		async execute(_toolCallId, params, signal, _onUpdate, ctx) {
			const args = ["note", params.id, "--message", params.message];
			addOptional(args, "--actor", params.actor);
			return runTlTool(pi, { cwd: ctx.cwd, signal }, args);
		},
	});

	pi.registerTool({
		name: "tl_close",
		label: "tl:close",
		description: "Mark a task ledger task as done.",
		promptSnippet: "Close a completed task ledger task",
		parameters: Type.Object({
			...IdParam,
			actor: Type.Optional(Type.String({ description: "Closing actor; omit for tl auto-resolution" })),
			force: Type.Optional(Type.Boolean({ description: "Close even when another actor holds an active claim" })),
		}),
		async execute(_toolCallId, params, signal, _onUpdate, ctx) {
			const args = ["close", params.id, "--json"];
			addOptional(args, "--actor", params.actor);
			addBoolean(args, "--force", params.force);
			return runTlTool(pi, { cwd: ctx.cwd, signal }, args, { parseJson: true });
		},
	});

	pi.registerTool({
		name: "tl_block",
		label: "tl:block",
		description: "Mark a task ledger task blocked with a reason.",
		promptSnippet: "Block a task with a reason when external progress is impossible",
		parameters: Type.Object({
			...IdParam,
			message: Type.String({ description: "Reason the task is blocked" }),
			actor: Type.Optional(Type.String({ description: "Actor performing the block; omit for tl auto-resolution" })),
		}),
		async execute(_toolCallId, params, signal, _onUpdate, ctx) {
			const args = ["block", params.id, "--message", params.message, "--json"];
			addOptional(args, "--actor", params.actor);
			return runTlTool(pi, { cwd: ctx.cwd, signal }, args, { parseJson: true });
		},
	});

	pi.registerTool({
		name: "tl_unblock",
		label: "tl:unblock",
		description: "Remove a block and return a task ledger task to open.",
		promptSnippet: "Unblock a blocked task",
		parameters: Type.Object(IdParam),
		async execute(_toolCallId, params, signal, _onUpdate, ctx) {
			return runTlTool(pi, { cwd: ctx.cwd, signal }, ["unblock", params.id, "--json"], { parseJson: true });
		},
	});

	pi.registerTool({
		name: "tl_cancel",
		label: "tl:cancel",
		description: "Cancel a task ledger task with a reason.",
		promptSnippet: "Cancel work that will not be done",
		parameters: Type.Object({
			...IdParam,
			message: Type.String({ description: "Reason for cancelling the task" }),
			actor: Type.Optional(Type.String({ description: "Actor cancelling the task; omit for tl auto-resolution" })),
			force: Type.Optional(Type.Boolean({ description: "Cancel even when another actor holds an active claim" })),
		}),
		async execute(_toolCallId, params, signal, _onUpdate, ctx) {
			const args = ["cancel", params.id, "--message", params.message, "--json"];
			addOptional(args, "--actor", params.actor);
			addBoolean(args, "--force", params.force);
			return runTlTool(pi, { cwd: ctx.cwd, signal }, args, { parseJson: true });
		},
	});

	pi.registerTool({
		name: "tl_pending",
		label: "tl:pending",
		description: "Mark a task ledger task as pending human input.",
		promptSnippet: "Ask a human question and mark the task pending",
		parameters: Type.Object({
			...IdParam,
			question: Type.String({ description: "Question for the human" }),
			actor: Type.Optional(Type.String({ description: "Actor requesting input; omit for tl auto-resolution" })),
		}),
		async execute(_toolCallId, params, signal, _onUpdate, ctx) {
			const args = ["pending", params.id, "--question", params.question, "--json"];
			addOptional(args, "--actor", params.actor);
			return runTlTool(pi, { cwd: ctx.cwd, signal }, args, { parseJson: true });
		},
	});

	pi.registerTool({
		name: "tl_resolve",
		label: "tl:resolve",
		description: "Answer a pending question and return a task ledger task to open.",
		promptSnippet: "Resolve a pending human-input question",
		parameters: Type.Object({
			...IdParam,
			answer: Type.String({ description: "Answer to the pending question" }),
		}),
		async execute(_toolCallId, params, signal, _onUpdate, ctx) {
			return runTlTool(pi, { cwd: ctx.cwd, signal }, ["resolve", params.id, "--answer", params.answer, "--json"], { parseJson: true });
		},
	});

	// tl_stale is a query tool; it sits here for alphabetical ordering among the lifecycle group
	pi.registerTool({
		name: "tl_stale",
		label: "tl:stale",
		description: "List task ledger tasks with expired claims.",
		promptSnippet: "List stale tasks whose claims have expired",
		parameters: Type.Object({}),
		async execute(_toolCallId, _params, signal, _onUpdate, ctx) {
			return runTlTool(pi, { cwd: ctx.cwd, signal }, ["stale", "--json"], { parseJson: true });
		},
	});

	// ── Dependency tools — task relationship links ──

	pi.registerTool({
		name: "tl_dep_add",
		label: "tl:dep:add",
		description: "Add a dependency link: a task depends on another task.",
		promptSnippet: "Add a task ledger dependency link",
		parameters: Type.Object({
			...IdParam,
			on: Type.String({ description: "Target task this task depends on" }),
		}),
		async execute(_toolCallId, params, signal, _onUpdate, ctx) {
			return runTlTool(pi, { cwd: ctx.cwd, signal }, ["dep", "add", params.id, "--on", params.on]);
		},
	});

	pi.registerTool({
		name: "tl_dep_remove",
		label: "tl:dep:remove",
		description: "Remove a dependency link from a task in a task ledger.",
		promptSnippet: "Remove a task ledger dependency link",
		parameters: Type.Object({
			...IdParam,
			on: Type.String({ description: "Target task to drop as a dependency" }),
		}),
		async execute(_toolCallId, params, signal, _onUpdate, ctx) {
			return runTlTool(pi, { cwd: ctx.cwd, signal }, ["dep", "remove", params.id, "--on", params.on]);
		},
	});
}
