import assert from "node:assert/strict";
import { test } from "node:test";
import { loadTlModule } from "./helpers.mjs";

function loadKeys() { return loadTlModule("keys.ts"); }

// ---------------------------------------------------------------------------
// Byte constants
// ---------------------------------------------------------------------------

test("BYTE_ESC is legacy raw escape byte", () => {
	const keys = loadKeys();
	assert.equal(keys.BYTE_ESC, "\x1b");
});

test("KITTY_ESC is Kitty CSI-u escape with no modifier", () => {
	const keys = loadKeys();
	assert.equal(keys.KITTY_ESC, "\x1b[27u");
});

test("KITTY_ESC_MOD1 is Kitty CSI-u escape with modifier byte", () => {
	const keys = loadKeys();
	assert.equal(keys.KITTY_ESC_MOD1, "\x1b[27;1u");
});

test("MODIFY_OTHER_KEYS_ESC is xterm modifyOtherKeys escape", () => {
	const keys = loadKeys();
	assert.equal(keys.MODIFY_OTHER_KEYS_ESC, "\x1b[27;1;27~");
});

test("KITTY_ENTER is Kitty CSI-u enter with no modifier", () => {
	const keys = loadKeys();
	assert.equal(keys.KITTY_ENTER, "\x1b[13u");
});

test("KITTY_ENTER_MOD1 is Kitty CSI-u enter with modifier byte", () => {
	const keys = loadKeys();
	assert.equal(keys.KITTY_ENTER_MOD1, "\x1b[13;1u");
});

test("CSI_UP is legacy CSI up arrow", () => {
	const keys = loadKeys();
	assert.equal(keys.CSI_UP, "\x1b[A");
});

test("SS3_UP is SS3 up arrow", () => {
	const keys = loadKeys();
	assert.equal(keys.SS3_UP, "\x1bOA");
});

test("KITTY_ARROW_UP is Kitty arrow shorthand up", () => {
	const keys = loadKeys();
	assert.equal(keys.KITTY_ARROW_UP, "\x1b[1;1A");
});

test("CSI_DOWN is legacy CSI down arrow", () => {
	const keys = loadKeys();
	assert.equal(keys.CSI_DOWN, "\x1b[B");
});

test("SS3_DOWN is SS3 down arrow", () => {
	const keys = loadKeys();
	assert.equal(keys.SS3_DOWN, "\x1bOB");
});

test("KITTY_ARROW_DOWN is Kitty arrow shorthand down", () => {
	const keys = loadKeys();
	assert.equal(keys.KITTY_ARROW_DOWN, "\x1b[1;1B");
});

// ---------------------------------------------------------------------------
// isEscape
// ---------------------------------------------------------------------------

test("isEscape matches legacy raw ESC byte", () => {
	const keys = loadKeys();
	assert.equal(keys.isEscape(keys.BYTE_ESC), true);
});

test("isEscape matches Kitty CSI-u escape without modifier", () => {
	const keys = loadKeys();
	assert.equal(keys.isEscape(keys.KITTY_ESC), true);
});

test("isEscape matches Kitty CSI-u escape with modifier byte", () => {
	const keys = loadKeys();
	assert.equal(keys.isEscape(keys.KITTY_ESC_MOD1), true);
});

test("isEscape matches xterm modifyOtherKeys escape", () => {
	const keys = loadKeys();
	assert.equal(keys.isEscape(keys.MODIFY_OTHER_KEYS_ESC), true);
});

test("isEscape rejects printable characters", () => {
	const keys = loadKeys();
	assert.equal(keys.isEscape("q"), false);
	assert.equal(keys.isEscape("a"), false);
	assert.equal(keys.isEscape("i"), false);
	assert.equal(keys.isEscape(" "), false);
	assert.equal(keys.isEscape("1"), false);
});

test("isEscape rejects unrelated escape sequences", () => {
	const keys = loadKeys();
	assert.equal(keys.isEscape("\x1b[A"), false);   // up arrow
	assert.equal(keys.isEscape("\x1b[B"), false);   // down arrow
	assert.equal(keys.isEscape("\x1b[13u"), false); // enter
	assert.equal(keys.isEscape("\x1b[1;1A"), false); // kitty arrow
});

test("isEscape rejects empty string", () => {
	const keys = loadKeys();
	assert.equal(keys.isEscape(""), false);
});

// ---------------------------------------------------------------------------
// isEnter
// ---------------------------------------------------------------------------

test("isEnter matches legacy carriage return", () => {
	const keys = loadKeys();
	assert.equal(keys.isEnter(keys.BYTE_CR), true);
});

test("isEnter matches legacy line feed", () => {
	const keys = loadKeys();
	assert.equal(keys.isEnter(keys.BYTE_LF), true);
});

test("isEnter matches Kitty CSI-u enter without modifier", () => {
	const keys = loadKeys();
	assert.equal(keys.isEnter(keys.KITTY_ENTER), true);
});

test("isEnter matches Kitty CSI-u enter with modifier byte", () => {
	const keys = loadKeys();
	assert.equal(keys.isEnter(keys.KITTY_ENTER_MOD1), true);
});

test("isEnter rejects printable characters", () => {
	const keys = loadKeys();
	assert.equal(keys.isEnter("q"), false);
	assert.equal(keys.isEnter("d"), false);
	assert.equal(keys.isEnter(" "), false);
});

test("isEnter rejects escape sequences", () => {
	const keys = loadKeys();
	assert.equal(keys.isEnter(keys.BYTE_ESC), false);
	assert.equal(keys.isEnter(keys.KITTY_ESC), false);
	assert.equal(keys.isEnter("\x1b[A"), false);
});

test("isEnter rejects empty string", () => {
	const keys = loadKeys();
	assert.equal(keys.isEnter(""), false);
});

// ---------------------------------------------------------------------------
// isArrowUp
// ---------------------------------------------------------------------------

test("isArrowUp matches legacy CSI up arrow", () => {
	const keys = loadKeys();
	assert.equal(keys.isArrowUp(keys.CSI_UP), true);
});

test("isArrowUp matches SS3 up arrow", () => {
	const keys = loadKeys();
	assert.equal(keys.isArrowUp(keys.SS3_UP), true);
});

test("isArrowUp matches Kitty arrow shorthand up", () => {
	const keys = loadKeys();
	assert.equal(keys.isArrowUp(keys.KITTY_ARROW_UP), true);
});

test("isArrowUp matches Kitty arrow up with event type", () => {
	const keys = loadKeys();
	assert.equal(keys.isArrowUp("\x1b[1;1:1A"), true);
});

test("isArrowUp matches Kitty arrow up with modifier and event type", () => {
	const keys = loadKeys();
	assert.equal(keys.isArrowUp("\x1b[1;5:1A"), true); // ctrl+up
});

test("isArrowUp rejects down arrow", () => {
	const keys = loadKeys();
	assert.equal(keys.isArrowUp(keys.CSI_DOWN), false);
	assert.equal(keys.isArrowUp(keys.SS3_DOWN), false);
	assert.equal(keys.isArrowUp(keys.KITTY_ARROW_DOWN), false);
});

test("isArrowUp rejects printable characters and escape", () => {
	const keys = loadKeys();
	assert.equal(keys.isArrowUp("k"), false);
	assert.equal(keys.isArrowUp("j"), false);
	assert.equal(keys.isArrowUp(keys.BYTE_ESC), false);
	assert.equal(keys.isArrowUp(keys.KITTY_ESC), false);
});

test("isArrowUp rejects empty string", () => {
	const keys = loadKeys();
	assert.equal(keys.isArrowUp(""), false);
});

// ---------------------------------------------------------------------------
// isArrowDown
// ---------------------------------------------------------------------------

test("isArrowDown matches legacy CSI down arrow", () => {
	const keys = loadKeys();
	assert.equal(keys.isArrowDown(keys.CSI_DOWN), true);
});

test("isArrowDown matches SS3 down arrow", () => {
	const keys = loadKeys();
	assert.equal(keys.isArrowDown(keys.SS3_DOWN), true);
});

test("isArrowDown matches Kitty arrow shorthand down", () => {
	const keys = loadKeys();
	assert.equal(keys.isArrowDown(keys.KITTY_ARROW_DOWN), true);
});

test("isArrowDown matches Kitty arrow down with event type", () => {
	const keys = loadKeys();
	assert.equal(keys.isArrowDown("\x1b[1;1:1B"), true);
});

test("isArrowDown matches Kitty arrow down with modifier and event type", () => {
	const keys = loadKeys();
	assert.equal(keys.isArrowDown("\x1b[1;5:1B"), true); // ctrl+down
});

test("isArrowDown rejects up arrow", () => {
	const keys = loadKeys();
	assert.equal(keys.isArrowDown(keys.CSI_UP), false);
	assert.equal(keys.isArrowDown(keys.SS3_UP), false);
	assert.equal(keys.isArrowDown(keys.KITTY_ARROW_UP), false);
});

test("isArrowDown rejects printable characters and escape", () => {
	const keys = loadKeys();
	assert.equal(keys.isArrowDown("k"), false);
	assert.equal(keys.isArrowDown("j"), false);
	assert.equal(keys.isArrowDown(keys.BYTE_ESC), false);
	assert.equal(keys.isArrowDown(keys.KITTY_ENTER), false);
});

test("isArrowDown rejects empty string", () => {
	const keys = loadKeys();
	assert.equal(keys.isArrowDown(""), false);
});

// ---------------------------------------------------------------------------
// Cross-matcher consistency: no input matches multiple matchers
// ---------------------------------------------------------------------------

test("no input matches more than one matcher", () => {
	const keys = loadKeys();
	const inputs = [
		keys.BYTE_ESC, keys.KITTY_ESC, keys.KITTY_ESC_MOD1, keys.MODIFY_OTHER_KEYS_ESC,
		keys.KITTY_ENTER, keys.KITTY_ENTER_MOD1, keys.BYTE_CR, keys.BYTE_LF,
		keys.CSI_UP, keys.SS3_UP, keys.KITTY_ARROW_UP,
		keys.CSI_DOWN, keys.SS3_DOWN, keys.KITTY_ARROW_DOWN,
		"\x1b[1;1:1A", "\x1b[1;1:1B",
	];

	for (const input of inputs) {
		const matches = [
			keys.isEscape(input),
			keys.isEnter(input),
			keys.isArrowUp(input),
			keys.isArrowDown(input),
		];
		const trueCount = matches.filter(Boolean).length;
		assert.equal(trueCount, 1, `expected exactly 1 match for ${JSON.stringify(input)}, got ${trueCount}: escape=${matches[0]} enter=${matches[1]} up=${matches[2]} down=${matches[3]}`);
	}
});
