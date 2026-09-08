import assert from "node:assert/strict";
import { test } from "node:test";
import { loadTlModule } from "./helpers.mjs";
import { createInitFixture } from "./init-fixture.mjs";

const cli = loadTlModule("cli.ts");

for (const [version, expected] of [
	["0.8.9", false], ["0.9.0", true], ["0.9.1", true], ["0.10.0", true],
	["1.0.0", true], ["10.0.0", true], ["0.9.0-rc.1", false],
	["0.9.0-0-db9cd9b", true], ["0.9.0-12-db9cd9b", true],
	["0.9.0-0-db9cd9b+local", true], ["0.9.0-0-DB9CD9B", true],
	["0.8.1-99-db9cd9b", false], ["0.9.0-rc.1-0-db9cd9b", false],
	["0.9.0-0-notahash", false], ["0.9.0-01-db9cd9b", false],
	["0.9.0-rc.1+build.2", false],
	["0.9.0+build.2", true], ["0.10.0-rc.1", true], ["0.8.99+build.2", false],
	["dev", false], ["0.9", false], ["0.9.0-01", false],
]) {
	test(`compatibility of ${version} is ${expected}`, () => {
		assert.equal(cli.isTlVersionCompatible(version), expected);
	});
}

function fixture(t, options) {
	const result = createInitFixture(options);
	t.after(result.cleanup);
	return result;
}

test("old CLI warns with detected/minimum versions and upgrade link, then confirms .tl/ creation", async (t) => {
	const f = fixture(t, { version: "0.8.1" });
	await f.run();
	const warning = f.notifications.find((entry) => entry.level === "warning");
	assert.match(warning?.message ?? "", /0\.8\.1.*0\.9\.0/);
	assert.match(warning.message, /[Uu]pgrade.*https:\/\/github.com\/aholbreich\/tl/);
	assert.equal(f.confirmations.length, 1);
	assert.match(f.confirmations[0].message, /\.tl\//);
	assert.doesNotMatch(f.confirmations[0].message, /\.taskledger/);
	assert.equal(f.initialized(), true);
	assert.equal(f.refreshCount(), 1);
	assert.deepEqual(f.initCalls()[0].args, ["--color", "always", "init"]);
	assert.equal(f.initCalls()[0].options.cwd, f.ctx.cwd);
	assert.equal(f.initCalls()[0].options.signal, f.ctx.signal);
});

test("existing ledger still warns without confirmation, initialization or refresh", async (t) => {
	const f = fixture(t, { version: "0.8.1", existing: true });
	await f.run();
	assert.ok(f.notifications.some((entry) => entry.level === "warning"));
	assert.ok(f.notifications.some((entry) => /already initialized/.test(entry.message)));
	assert.equal(f.confirmations.length, 0);
	assert.equal(f.initCalls().length, 0);
	assert.equal(f.refreshCount(), 0);
});

test("declining initialization never mutates the ledger or refreshes the overlay", async (t) => {
	const f = fixture(t, { version: "0.8.1", confirm: false });
	await f.run();
	assert.equal(f.initCalls().length, 0);
	assert.equal(f.initialized(), false);
	assert.equal(f.refreshCount(), 0);
});

for (const options of [{ missing: true }, { versionCode: 1 }]) {
	test(`unavailable CLI provides manual guidance without confirmation or installation: ${JSON.stringify(options)}`, async (t) => {
		const f = fixture(t, options);
		await f.run();
		assert.ok(f.notifications.some((entry) => /PATH/.test(entry.message) && /installation-options/.test(entry.message)));
		assert.equal(f.confirmations.length, 0);
		assert.equal(f.initCalls().length, 0);
		assert.equal(f.refreshCount(), 0);
	});
}

test("unrecognized version warns without falsely calling it incompatible", async (t) => {
	const f = fixture(t, { version: "dev" });
	await f.run();
	const warning = f.notifications.find((entry) => entry.level === "warning");
	assert.match(warning?.message ?? "", /cannot verify.*compatibility/i);
	assert.doesNotMatch(warning.message, /incompatible|older than/i);
	assert.equal(f.initialized(), true);
});

for (const options of [
	{ initResult: { code: 1, stderr: "permission denied" } },
	{ initResult: { killed: true } },
	{ initError: new Error("spawn tl ENOENT") },
]) {
	test(`failed initialization reports an error and never reports success: ${JSON.stringify(options)}`, async (t) => {
		const f = fixture(t, options);
		await f.run();
		assert.ok(f.notifications.some((entry) => entry.level === "error"));
		assert.equal(f.statuses.length, 0);
		assert.equal(f.refreshCount(), 0);
		assert.equal(f.initialized(), false);
	});
}

test("noninteractive initialization keeps color disabled", async (t) => {
	const f = fixture(t, { hasUI: false });
	await f.run();
	assert.deepEqual(f.initCalls()[0].args, ["--color", "never", "init"]);
});
