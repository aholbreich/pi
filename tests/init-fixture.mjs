import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadTlModule } from "./helpers.mjs";

export function createInitFixture(options = {}) {
	const cwd = mkdtempSync(join(tmpdir(), "pi-tl-init-"));
	const ledger = join(cwd, ".tl");
	if (options.existing) mkdirSync(ledger);
	const calls = [];
	const notifications = [];
	const confirmations = [];
	const statuses = [];
	const commands = new Map();
	let refreshCount = 0;
	const pi = {
		registerCommand: (name, command) => commands.set(name, command),
		registerShortcut: () => {},
		exec: async (command, args, execOptions) => {
			calls.push({ command, args, options: execOptions });
			assert.equal(command, "tl", "initialization must not run an unverified installer");
			if (args.includes("--version")) {
				if (options.missing) throw new Error("spawn tl ENOENT");
				return {
					code: options.versionCode ?? 0,
					stdout: `tl version ${options.version ?? "0.9.0"}\n`, stderr: "",
				};
			}
			assert.ok(args.includes("init"), `unexpected command: ${args.join(" ")}`);
			if (options.initError) throw options.initError;
			const result = { code: 0, stdout: "Initialized task ledger.", stderr: "", ...options.initResult };
			if (result.code === 0 && !result.killed) mkdirSync(ledger);
			return result;
		},
	};
	const ctx = {
		cwd, signal: new AbortController().signal, hasUI: options.hasUI ?? true,
		ui: {
			confirm: async (title, message) => {
				confirmations.push({ title, message });
				return options.confirm ?? true;
			},
			notify: (message, level) => notifications.push({ message, level }),
			setStatus: (key, value) => statuses.push({ key, value }),
		},
	};
	loadTlModule("commands.ts").registerTlCommands(pi, async () => { refreshCount++; });
	return {
		calls, notifications, confirmations, statuses, ctx,
		run: () => commands.get("tl-init").handler("", ctx),
		initialized: () => existsSync(ledger),
		makeLedger: () => mkdirSync(ledger),
		initCalls: () => calls.filter((call) => call.args.includes("init")),
		refreshCount: () => refreshCount,
		cleanup: () => rmSync(cwd, { recursive: true, force: true }),
	};
}
