import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { addOptional, addTags } from "./args.js";
import { runTl } from "./cli.js";
import { Priority } from "./schemas.js";

/**
 * Register the small set of LLM-callable helpers that add value beyond the tl CLI.
 *
 * The agent should use plain `tl ...` commands for normal ledger operations.
 * We intentionally do not mirror the full tl CLI here because that creates a
 * second surface that drifts from upstream. Keep only helpers that compose
 * multiple tl calls or provide extension-specific orchestration.
 */
export function registerTlTools(pi: ExtensionAPI): void {
	// tl_bulk_create composes multiple tl create calls and builds a summary report.
	// It uses runTl() directly instead of asking the model to make several tool
	// calls, so it can aggregate individual results and report partial failures.
	pi.registerTool({
		name: "tl_bulk_create",
		label: "tl:bulk:create",
		description: "Create multiple task ledger tasks sequentially with one tool call.",
		promptSnippet: "Create multiple task ledger tasks from a cleaned list",
		promptGuidelines: [
			"Use tl_bulk_create only after the user has approved a cleaned list of multiple tasks; for one task, use the tl CLI directly, e.g. `tl create`.",
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
}
