import type { ExtensionAPI, ExtensionCommandContext, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { openTaskLedgerBoard, type BoardSelection } from "./board.js";
import { runTl } from "./cli.js";
import { hasLedger } from "./ledger.js";
import { buildCapturePrompt, buildTaskWorkflowPrompt, workflowActionForBoardSelection } from "./prompts.js";

const TL_BOARD_SHORTCUT = "alt+l";

/**
 * Register user-facing slash commands.
 *
 * Slash commands are what you type in Pi, for example `/tl-board`.
 * They are different from tools: tools are called by the model, commands are
 * usually called directly by the user.
 */
export function registerTlCommands(pi: ExtensionAPI, onLedgerChanged?: (ctx: ExtensionCommandContext) => Promise<void>): void {
	pi.registerCommand("tl-capture", {
		description: "Capture rough todos and ask the agent to refine them into task ledger tasks",
		handler: async (args, ctx) => {
			const initialText = args.trim();
			const captured = await ctx.ui.editor(
				"Capture rough todos for tl",
				initialText || "- ",
			);
			const todos = captured?.trim();
			if (!todos || todos === "-") {
				ctx.ui.notify("No todos captured.", "info");
				return;
			}

			pi.sendUserMessage(buildCapturePrompt(todos), ctx.isIdle() ? undefined : { deliverAs: "followUp" });
			ctx.ui.notify("Sent captured todos to the agent for refinement.", "info");
		},
	});

	pi.registerCommand("tl-board", {
		description: "Open a keyboard-navigable Task Ledger board overlay",
		handler: async (_args, ctx) => openBoardAndHandleSelection(pi, ctx),
	});

	pi.registerShortcut(TL_BOARD_SHORTCUT, {
		description: "Open Task Ledger board",
		handler: async (ctx) => openBoardAndHandleSelection(pi, ctx),
	});

	pi.registerCommand("tl-init", {
		description: "Initialize task ledger in this repository after confirmation",
		handler: async (_args, ctx) => {
			if (hasLedger(ctx)) {
				ctx.ui.notify("task ledger is already initialized in this repository.", "info");
				return;
			}

			const ok = await ctx.ui.confirm("Initialize task ledger?", `Run tl init in ${ctx.cwd}? This will create .taskledger/.`);
			if (!ok) return;

			const run = await runTl(pi, ctx, ["init"], { color: ctx.hasUI ? "always" : "never" });
			if (run.exitCode !== 0) {
				ctx.ui.notify(run.stderr.trim() || run.stdout.trim() || `tl init failed with exit code ${run.exitCode}`, "error");
				return;
			}
			ctx.ui.setStatus("pi-tl", "tl");
			await onLedgerChanged?.(ctx);
			ctx.ui.notify(run.stdout.trim() || "Initialized task ledger.", "info");
		},
	});
}

async function openBoardAndHandleSelection(pi: ExtensionAPI, ctx: ExtensionContext): Promise<void> {
	const selection = await openTaskLedgerBoard(pi, ctx);
	if (!selection) return;
	await handleBoardSelection(pi, ctx, selection);
}

async function handleBoardSelection(pi: ExtensionAPI, ctx: ExtensionContext, selection: BoardSelection): Promise<void> {
	const promptAction = workflowActionForBoardSelection(selection.action);
	pi.sendUserMessage(buildTaskWorkflowPrompt(selection.id, promptAction), ctx.isIdle() ? undefined : { deliverAs: "followUp" });
	ctx.ui.notify(`Sent ${selection.action} request for ${selection.id} to the agent.`, "info");
}

