import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { loadTlModule } from "./helpers.mjs";

const { TaskLedgerOverlay } = loadTlModule("task-summary-overlay.ts");

const theme = {
	fg: (color, text) => `[${color}]${text}[/${color}]`,
};

const probe = (cwd, signal) => ({
	command: "tl",
	args: ["--color", "never", "--version"],
	options: { cwd, signal, timeout: 2_000 },
});

// [label, exec result for --version, expected status (with color tags), probe count]
for (const [label, result, expected, probeCount] of [
	["stable", { stdout: "tl version 0.9.0\n" }, "[dim]tl 0.9.0: 0r[/dim]", 2],
	["git-build", { stdout: "tl version 0.9.0-0-db9cd9b" }, "[dim]tl 0.9.0-0-db9cd9b: 0r[/dim]", 2],
	["prerelease", { stdout: "tl version v0.9.0-rc.1+build.2" }, "[warning]tl 0.9.0-rc.1+build.2: incompatible[/warning]", 2],
	["too-old", { stdout: "tl version 0.6.0" }, "[warning]tl 0.6.0: incompatible[/warning]", 2],
	["unknown", { stdout: "tl version dev" }, "[warning]tl: incompatible[/warning]", 2],
	["failed", { code: 1, stdout: "tl version 0.9.0" }, "[error]tl: not found[/error]", 1],
	["missing", new Error("spawn tl ENOENT"), "[error]tl: not found[/error]", 1],
]) {
	test(`overlay caches the ${label} version state across refreshes`, async (t) => {
		const cwd = mkdtempSync(join(tmpdir(), "pi-tl-version-test-"));
		t.after(() => rmSync(cwd, { recursive: true, force: true }));
		mkdirSync(join(cwd, ".tl"));
		const probes = [];
		const statuses = [];
		const signal = new AbortController().signal;
		const overlay = new TaskLedgerOverlay({
			exec: async (command, args, options) => {
				if (!args.includes("--version")) return { code: 0, stdout: "[]", stderr: "" };
				probes.push({ command, args, options });
				if (result instanceof Error) throw result;
				return { code: 0, stderr: "", ...result };
			},
		});
		t.after(() => overlay.dispose());
		const ctx = {
			cwd,
			signal,
			hasUI: true,
			ui: {
				theme,
				setStatus: (key, value) => statuses.push({ key, value }),
				setWidget: () => {},
			},
		};
		await overlay.refresh(ctx);
		await overlay.refresh(ctx);
		assert.deepEqual(statuses, [
			{ key: "pi-tl", value: expected },
			{ key: "pi-tl", value: expected },
		]);
		assert.deepEqual(probes, Array.from({ length: probeCount }, () => probe(cwd, signal)));
	});
}

test("initialized overlay colors the label green and keeps per-section count colors", async (t) => {
	const cwd = mkdtempSync(join(tmpdir(), "pi-tl-status-test-"));
	t.after(() => rmSync(cwd, { recursive: true, force: true }));
	mkdirSync(join(cwd, ".tl"));
	const statuses = [];
	const overlay = new TaskLedgerOverlay({
		exec: async (_command, args) => {
			if (args.includes("--version")) return { code: 0, stdout: "tl version 0.9.0", stderr: "" };
			if (args.includes("ready")) return { code: 0, stdout: JSON.stringify([{ id: "t1", title: "Ready task", status: "open", priority: "medium", tags: [] }]), stderr: "" };
			return { code: 0, stdout: "[]", stderr: "" };
		},
	});
	t.after(() => overlay.dispose());
	await overlay.refresh({
		cwd,
		signal: undefined,
		hasUI: true,
		ui: { theme, setStatus: (key, value) => statuses.push({ key, value }), setWidget: () => {} },
	});
	assert.equal(statuses.at(-1).value, "[success]tl 0.9.0:[/success] [accent]○1[/accent]");
});

test("noninteractive overlay does not probe the CLI", async () => {
	const overlay = new TaskLedgerOverlay({ exec: () => assert.fail("unexpected CLI call") });
	await overlay.refresh({ hasUI: false });
});
