import assert from "node:assert/strict";
import { test } from "node:test";
import { loadTlModule } from "./helpers.mjs";

function loadArgs() { return loadTlModule("args.ts"); }

// ---------------------------------------------------------------------------
// addOptional
// ---------------------------------------------------------------------------

test("addOptional appends flag and trimmed value when non-empty", () => {
	const { addOptional } = loadArgs();
	const args = [];
	addOptional(args, "--priority", "high");
	assert.deepEqual(args, ["--priority", "high"]);
});

test("addOptional trims whitespace from value", () => {
	const { addOptional } = loadArgs();
	const args = [];
	addOptional(args, "--title", "  hello  ");
	assert.deepEqual(args, ["--title", "hello"]);
});

test("addOptional skips empty string", () => {
	const { addOptional } = loadArgs();
	const args = [];
	addOptional(args, "--title", "");
	assert.deepEqual(args, []);
});

test("addOptional skips whitespace-only string", () => {
	const { addOptional } = loadArgs();
	const args = [];
	addOptional(args, "--title", "   ");
	assert.deepEqual(args, []);
});

test("addOptional skips non-string values", () => {
	const { addOptional } = loadArgs();
	let args = [];
	addOptional(args, "--count", 5);
	assert.deepEqual(args, []);

	args = [];
	addOptional(args, "--flag", true);
	assert.deepEqual(args, []);

	args = [];
	addOptional(args, "--val", null);
	assert.deepEqual(args, []);

	args = [];
	addOptional(args, "--val", undefined);
	assert.deepEqual(args, []);
});

// ---------------------------------------------------------------------------
// addBoolean
// ---------------------------------------------------------------------------

test("addBoolean appends flag when value is true", () => {
	const { addBoolean } = loadArgs();
	const args = [];
	addBoolean(args, "--json", true);
	assert.deepEqual(args, ["--json"]);
});

test("addBoolean skips when value is false", () => {
	const { addBoolean } = loadArgs();
	const args = [];
	addBoolean(args, "--json", false);
	assert.deepEqual(args, []);
});

test("addBoolean skips non-boolean truthy values", () => {
	const { addBoolean } = loadArgs();
	const args = [];
	addBoolean(args, "--flag", "true");
	assert.deepEqual(args, []);
	addBoolean(args, "--flag", 1);
	assert.deepEqual(args, []);
});

test("addBoolean skips null and undefined", () => {
	const { addBoolean } = loadArgs();
	const args = [];
	addBoolean(args, "--flag", null);
	addBoolean(args, "--flag", undefined);
	assert.deepEqual(args, []);
});

// ---------------------------------------------------------------------------
// addPositional
// ---------------------------------------------------------------------------

test("addPositional appends trimmed value when non-empty", () => {
	const { addPositional } = loadArgs();
	const args = [];
	addPositional(args, "ready");
	assert.deepEqual(args, ["ready"]);
});

test("addPositional trims whitespace", () => {
	const { addPositional } = loadArgs();
	const args = [];
	addPositional(args, "  create  ");
	assert.deepEqual(args, ["create"]);
});

test("addPositional skips empty string", () => {
	const { addPositional } = loadArgs();
	const args = [];
	addPositional(args, "");
	assert.deepEqual(args, []);
});

test("addPositional skips whitespace-only", () => {
	const { addPositional } = loadArgs();
	const args = [];
	addPositional(args, "   ");
	assert.deepEqual(args, []);
});

test("addPositional skips non-string values", () => {
	const { addPositional } = loadArgs();
	const args = [];
	addPositional(args, 42);
	addPositional(args, null);
	addPositional(args, undefined);
	assert.deepEqual(args, []);
});

// ---------------------------------------------------------------------------
// addTags
// ---------------------------------------------------------------------------

test("addTags appends --tag for each tag", () => {
	const { addTags } = loadArgs();
	const args = [];
	addTags(args, ["ux", "auth", "docs"]);
	assert.deepEqual(args, ["--tag", "ux", "--tag", "auth", "--tag", "docs"]);
});

test("addTags trims whitespace from tags", () => {
	const { addTags } = loadArgs();
	const args = [];
	addTags(args, ["  a  ", " b "]);
	assert.deepEqual(args, ["--tag", "a", "--tag", "b"]);
});

test("addTags skips empty-string tags", () => {
	const { addTags } = loadArgs();
	const args = [];
	addTags(args, ["a", "", "b"]);
	assert.deepEqual(args, ["--tag", "a", "--tag", "b"]);
});

test("addTags skips whitespace-only tags", () => {
	const { addTags } = loadArgs();
	const args = [];
	addTags(args, ["   ", "valid"]);
	assert.deepEqual(args, ["--tag", "valid"]);
});

test("addTags skips non-string tag entries", () => {
	const { addTags } = loadArgs();
	const args = [];
	addTags(args, ["a", 5, null, "b"]);
	assert.deepEqual(args, ["--tag", "a", "--tag", "b"]);
});

test("addTags handles non-array input", () => {
	const { addTags } = loadArgs();
	let args = [];
	addTags(args, null);
	assert.deepEqual(args, []);

	args = [];
	addTags(args, undefined);
	assert.deepEqual(args, []);

	args = [];
	addTags(args, "not-an-array");
	assert.deepEqual(args, []);

	args = [];
	addTags(args, {});
	assert.deepEqual(args, []);
});

test("addTags handles empty array", () => {
	const { addTags } = loadArgs();
	const args = [];
	addTags(args, []);
	assert.deepEqual(args, []);
});
