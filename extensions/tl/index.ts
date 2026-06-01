import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerTlCommands } from "./commands.js";
import { hasLedger } from "./ledger.js";
import { TaskLedgerOverlay } from "./task-summary-overlay.js";
import { registerTlTools } from "./agent-tools.js";

/**
 * Main entry point for the Pi extension.
 *
 * Pi calls this default function once when the extension is loaded. The `pi`
 * object is Pi's extension API: we use it to register event handlers, tools,
 * commands, and UI changes.
 */
export default function taskLedgerExtension(pi: ExtensionAPI): void {
	const overlay = new TaskLedgerOverlay(pi);

	// Update the footer/status line and live overlay when a session starts or reloads.
	pi.on("session_start", async (_event, ctx) => {
		ctx.ui.setStatus("pi-tl", hasLedger(ctx) ? "tl" : "tl: no ledger");
		await overlay.refresh(ctx);
	});

	// Add TaskLedger guidance to the system prompt only for repositories that
	// already contain `.taskledger/`. If the repo is not initialized, we stay quiet.
	pi.on("before_agent_start", (event, ctx) => {
		if (!hasLedger(ctx)) return;
		return {
			systemPrompt:
				event.systemPrompt +
				"\n\ntask ledger is available in this repository via the tl_* tools. Prefer tl_ready before choosing queued work; use tl_history/tl_show for context; claim with tl_claim before editing; add tl_note for progress; finish with tl_close, tl_block, tl_pending, tl_cancel, or tl_release as appropriate.",
		};
	});

	pi.on("tool_execution_end", async (event, ctx) => {
		if (!event.toolName.startsWith("tl_") || event.isError) return;
		await overlay.refresh(ctx);
	});

	pi.on("session_compact", async (_event, ctx) => {
		await overlay.refresh(ctx);
	});

	pi.on("session_tree", async (_event, ctx) => {
		await overlay.refresh(ctx);
	});

	pi.on("session_shutdown", () => {
		overlay.dispose();
	});

	pi.registerShortcut("alt+t", {
		description: "Toggle Task Ledger overlay",
		handler: async (ctx) => overlay.toggle(ctx),
	});

	registerTlTools(pi);
	registerTlCommands(pi, async (ctx) => overlay.refresh(ctx));
}
