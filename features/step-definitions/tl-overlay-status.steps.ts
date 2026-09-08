/**
 * Step definitions for tl-overlay-status.feature
 *
 * Exercises the passive TaskLedgerOverlay footer status states directly with a
 * mock tl CLI, without registering the full extension.
 */
import { Given, When, Then, setWorldConstructor, World } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const require = createRequire(import.meta.url);

function loadJiti() {
	try {
		return require("jiti");
	} catch {
		return require(join(process.cwd(), "node_modules/@earendil-works/pi-coding-agent/node_modules/jiti/lib/jiti.cjs"));
	}
}

const { createJiti } = loadJiti();
const jiti = createJiti(join(process.cwd(), "tests/extension.test.mjs"));
const { TaskLedgerOverlay } = jiti("../extensions/tl/task-summary-overlay.ts");

// Tag colors so the Then step can assert the exact colored status string.
const theme = {
	fg: (color: string, text: string) => `[${color}]${text}[/${color}]`,
};

type CliFixture =
	| { kind: "missing" }
	| { kind: "ok"; version: string };

interface OverlayStatusWorld {
	cwd: string;
	cli: CliFixture;
	hasLedgerDir: boolean;
	statuses: Array<{ key: string; value: string }>;
}

class OverlayStatusWorld extends World {
	cwd = "";
	cli: CliFixture = { kind: "ok", version: "0.9.0" };
	hasLedgerDir = true;
	statuses: Array<{ key: string; value: string }> = [];
}

setWorldConstructor(OverlayStatusWorld);

Given("the tl CLI is not on PATH", function (this: OverlayStatusWorld) {
	this.cli = { kind: "missing" };
});

Given("the tl CLI reports version {string}", function (this: OverlayStatusWorld, version: string) {
	this.cli = { kind: "ok", version };
});

Given("no task ledger directory exists", function (this: OverlayStatusWorld) {
	this.hasLedgerDir = false;
});

Given("a task ledger directory exists with no tasks", function (this: OverlayStatusWorld) {
	this.hasLedgerDir = true;
});

When("the task ledger overlay refreshes", async function (this: OverlayStatusWorld) {
	this.cwd = mkdtempSync(join(tmpdir(), "pi-tl-overlay-bdd-"));
	if (this.hasLedgerDir) mkdirSync(join(this.cwd, ".tl"));
	this.statuses = [];

	const overlay = new TaskLedgerOverlay({
		exec: async (_cmd: string, args: string[]) => {
			if (!args.includes("--version")) return { code: 0, stdout: "[]", stderr: "" };
			if (this.cli.kind === "missing") throw new Error("spawn tl ENOENT");
			return { code: 0, stdout: `tl version ${this.cli.version}`, stderr: "" };
		},
	});

	try {
		await overlay.refresh({
			cwd: this.cwd,
			signal: undefined,
			hasUI: true,
			ui: {
				theme,
				setStatus: (key: string, value: string) => this.statuses.push({ key, value }),
				setWidget: () => {},
			},
		});
	} finally {
		overlay.dispose();
		rmSync(this.cwd, { recursive: true, force: true });
	}
});

Then("the footer status shows {string} in {string} color", function (this: OverlayStatusWorld, text: string, color: string) {
	assert.ok(this.statuses.length > 0, "expected the overlay to set a footer status");
	const expected = `[${color}]${text}[/${color}]`;
	assert.equal(this.statuses.at(-1)?.value, expected);
});
