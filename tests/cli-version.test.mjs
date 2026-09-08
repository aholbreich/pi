import assert from "node:assert/strict";
import { test } from "node:test";
import { loadTlModule } from "./helpers.mjs";

const cli = loadTlModule("cli.ts");
const ctx = { cwd: "/project with spaces", signal: new AbortController().signal };

function stub(result = {}) {
	const calls = [];
	return {
		calls,
		pi: {
			exec: async (command, args, options) => {
				calls.push({ command, args, options });
				if (result instanceof Error) throw result;
				return { code: 0, stdout: "tl version 0.9.0\n", stderr: "", killed: false, ...result };
			},
		},
	};
}

test("minimum supported tl version is the current stable 0.9.0 floor", () => {
	assert.equal(cli.MIN_TL_VERSION, "0.9.0");
});

for (const name of ["isTlAvailable", "getTlVersion"]) {
	test(`${name} uses one color-free probe with a 2-second timeout and the caller context`, async () => {
		const { pi, calls } = stub();
		await cli[name](pi, ctx);
		assert.deepEqual(calls, [{
			command: "tl",
			args: ["--color", "never", "--version"],
			options: { cwd: ctx.cwd, signal: ctx.signal, timeout: 2_000 },
		}]);
	});

	for (const [label, result] of [
		["missing executable", new Error("spawn tl ENOENT")],
		["rejected timeout", new Error("Process timed out")],
		["nonzero exit even with version output", { code: 1 }],
		["missing exit code", { code: undefined }],
		["killed process even with zero exit", { killed: true }],
	]) {
		test(`${name} handles ${label}`, async () => {
			assert.equal(await cli[name](stub(result).pi, ctx), name === "isTlAvailable" ? false : null);
		});
	}
}

for (const [output, expected] of [
	["tl version 0.9.0\n", "0.9.0"],
	["  tl version v0.9.0\r\n", "0.9.0"],
	["tl 0.9.0", "0.9.0"],
	["0.9.0", "0.9.0"],
	["v0.9.0", "0.9.0"],
	["tl version 0.9.0-0-db9cd9b", "0.9.0-0-db9cd9b"],
	["tl version 1.2.3-rc.1+build.004", "1.2.3-rc.1+build.004"],
	["tl version 0.8.1", "0.8.1"],
	["tl version 10.20.30", "10.20.30"],
]) {
	test(`getTlVersion parses ${JSON.stringify(output)} without enforcing compatibility`, async () => {
		assert.equal(await cli.getTlVersion(stub({ stdout: output }).pi, ctx), expected);
	});
}

for (const output of [
	"", "\n", "tl version dev", "tl version 0.9", "tl version 01.9.0",
	"tl version 0.9.0-01", "tl version 0.9.0-rc..1", "tl version 0.9.0+",
	"tl version 0.9.0 trailing garbage", "unrelated tool 0.9.0",
]) {
	test(`unrecognized output ${JSON.stringify(output)} is available but has no parsed version`, async () => {
		const { pi } = stub({ stdout: output });
		assert.equal(await cli.isTlAvailable(pi, ctx), true);
		assert.equal(await cli.getTlVersion(pi, ctx), null);
	});
}

test("version helpers do not cache failures or versions across callers", async () => {
	assert.equal(await cli.getTlVersion(stub(new Error("not installed")).pi, ctx), null);
	assert.equal(await cli.getTlVersion(stub().pi, ctx), "0.9.0");
	assert.equal(await cli.getTlVersion(stub({ stdout: "tl version 1.0.0" }).pi, ctx), "1.0.0");
});
