/**
 * Terminal keyboard protocol matchers.
 *
 * Modern terminals use one of three protocols to encode special keys.
 * This module provides matcher functions that work across all three,
 * plus named constants for use in test fixtures.
 *
 * ## Supported protocols
 *
 * | Protocol          | Mode              | Example (Escape)   |
 * |-------------------|-------------------|--------------------|
 * | Legacy raw        | default           | `\x1b`             |
 * | Kitty CSI-u       | flag 1 enabled    | `\x1b[27u`         |
 * | xterm modifyOtherKeys | fallback      | `\x1b[27;1;27~`    |
 *
 * Pi TUI enables Kitty protocol with the disambiguate-escape-codes flag (1),
 * so in practice Escape (codepoint 27), Enter (13), and arrows arrive as
 * CSI-u sequences on any terminal that supports the protocol.
 *
 * Reference: https://sw.kovidgoyal.net/kitty/keyboard-protocol/
 */

// ---------------------------------------------------------------------------
// Raw byte sequence constants (useful for test fixtures)
// ---------------------------------------------------------------------------

/** Legacy raw ESC byte. */
export const BYTE_ESC = "\x1b";

/** Kitty CSI-u: Escape key, no modifier. */
export const KITTY_ESC = "\x1b[27u";

/** Kitty CSI-u: Escape key, modifier byte present (mod=1 = none). */
export const KITTY_ESC_MOD1 = "\x1b[27;1u";

/** xterm modifyOtherKeys: Escape key (27; modifierIdx=1; keycode=27). */
export const MODIFY_OTHER_KEYS_ESC = "\x1b[27;1;27~";

/** Kitty CSI-u: Enter key, no modifier. */
export const KITTY_ENTER = "\x1b[13u";

/** Kitty CSI-u: Enter key, modifier byte present (mod=1 = none). */
export const KITTY_ENTER_MOD1 = "\x1b[13;1u";

/** Legacy Enter: carriage return. */
export const BYTE_CR = "\r";

/** Legacy Enter: line feed. */
export const BYTE_LF = "\n";

/** Legacy CSI up arrow. */
export const CSI_UP = "\x1b[A";

/** SS3 up arrow. */
export const SS3_UP = "\x1bOA";

/** Kitty arrow shorthand: up. */
export const KITTY_ARROW_UP = "\x1b[1;1A";

/** Legacy CSI down arrow. */
export const CSI_DOWN = "\x1b[B";

/** SS3 down arrow. */
export const SS3_DOWN = "\x1bOB";

/** Kitty arrow shorthand: down. */
export const KITTY_ARROW_DOWN = "\x1b[1;1B";

// ---------------------------------------------------------------------------
// Regexes (private — use the named functions below)
// ---------------------------------------------------------------------------

/** Escape across all three protocols. */
const ESCAPE_RE = /^\x1b$|^\x1b\[27(?:;1)?u$|^\x1b\[27;1;27~$/;

/** Enter/Return across legacy and Kitty CSI-u. */
const ENTER_RE = /^[\r\n]$|^\x1b\[13(?:;1)?u$/;

/** Up arrow across legacy CSI, SS3, and Kitty arrow shorthand.
 *  Does NOT cover the full CSI-u encoding (\x1b[57419u) because Pi TUI
 *  emits the shorthand \x1b[1;<mod>A form for arrows. */
const ARROW_UP_RE = /^\x1b\[A$|^\x1bOA$|^\x1b\[1;\d+(?::\d+)?A$/;

/** Down arrow — same coverage as ARROW_UP_RE. */
const ARROW_DOWN_RE = /^\x1b\[B$|^\x1bOB$|^\x1b\[1;\d+(?::\d+)?B$/;

// ---------------------------------------------------------------------------
// Public matchers
// ---------------------------------------------------------------------------

/** True when `data` represents the Escape key in any terminal protocol. */
export function isEscape(data: string): boolean {
	return ESCAPE_RE.test(data);
}

/** True when `data` represents the Enter/Return key in any terminal protocol. */
export function isEnter(data: string): boolean {
	return ENTER_RE.test(data);
}

/** True when `data` represents the Up arrow key in any terminal protocol. */
export function isArrowUp(data: string): boolean {
	return ARROW_UP_RE.test(data);
}

/** True when `data` represents the Down arrow key in any terminal protocol. */
export function isArrowDown(data: string): boolean {
	return ARROW_DOWN_RE.test(data);
}
