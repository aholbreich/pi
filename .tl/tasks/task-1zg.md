---
id: task-1zg
title: Add unit tests for keys.ts terminal protocol matchers
status: done
priority: high
type: task
created_at: 2026-06-03T16:32:59Z
updated_at: 2026-06-03T16:36:04Z
created_by: human
assignee: null
depends_on: []
claim:
  actor: null
  claimed_at: null
  expires_at: null
  heartbeat_at: null
tags:
  - tests
  - keys
  - unit
---

## Description

**File:** `extensions/tl/keys.ts` → new test file `tests/keys.test.ts`

**Why:** `keys.ts` has zero dedicated tests. Five BDD scenarios exercise different escape byte encodings through the full Cucumber stack (~100ms each) when each encoding is a single assertion in a 1ms unit test. The module is pure functions — no Pi API, no async, no mocks needed.

**What to test:**

**`isEscape(data)`**
- Legacy raw ESC byte (\x1b) → true
- Kitty CSI-u \x1b[27u → true
- Kitty CSI-u with modifier \x1b[27;1u → true
- xterm modifyOtherKeys \x1b[27;1;27~ → true
- Rejects: printable chars ("q", "a")
- Rejects: unrelated escape sequences (\x1b[A, \x1b[13u)
- Rejects: empty string

**`isEnter(data)`**
- Legacy CR (\r) → true
- Legacy LF (\n) → true
- Kitty CSI-u \x1b[13u → true
- Kitty CSI-u with modifier \x1b[13;1u → true
- Rejects: printable chars
- Rejects: escape

**`isArrowUp(data)`**
- Legacy CSI \x1b[A → true
- SS3 \x1bOA → true
- Kitty arrow \x1b[1;1A → true
- Kitty arrow with event type \x1b[1;1:1A → true
- Rejects: down arrow, printable chars

**`isArrowDown(data)`**
- Legacy CSI \x1b[B → true
- SS3 \x1bOB → true
- Kitty arrow \x1b[1;1B → true
- Kitty arrow with event type \x1b[1;1:1B → true
- Rejects: up arrow, printable chars

**Byte constants**
- Verify each exported constant matches its documented byte sequence (BYTE_ESC, KITTY_ESC, KITTY_ESC_MOD1, MODIFY_OTHER_KEYS_ESC, KITTY_ENTER, CSI_UP, SS3_UP, CSI_DOWN, SS3_DOWN, KITTY_ARROW_UP, KITTY_ARROW_DOWN)

**Implementation:** Uses `node:test` + `node:assert/strict`. Imports from `../extensions/tl/keys.ts` via jiti (same pattern as existing tests). No external dependencies. Expected runtime: <10ms.

## Notes

- 2026-06-03T16:36:04Z [pi-agent] note: Added tests/keys.test.mjs: 43 unit tests covering all 4 matchers across 3 terminal protocols, 12 byte constant verifications, and cross-matcher ambiguity check. All pass in 71ms.
