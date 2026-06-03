---
id: task-8ym
title: Change board borders to white to match title color
status: open
priority: low
type: task
created_at: 2026-06-03T18:01:31Z
updated_at: 2026-06-03T18:01:31Z
created_by: human
assignee: null
depends_on: []
claim:
  actor: null
  claimed_at: null
  expires_at: null
  heartbeat_at: null
tags:
  - board
  - ui
  - border
---

## Description

The board title text uses the `"text"` color (white), but all border characters (`│`, `╭╮╰╯`, `├┤`, `──`) use `"borderMuted"`. Change all border rendering in `board.ts` from `"borderMuted"` to `"text"` for visual consistency — borders match the title.\n\nAffected methods:\n- `panelStyledLine` — side borders `│`\n- `borderTop` — `╭──╮`\n- `borderBottom` — `╰──╯`\n- `separatorLine` — `├──┤`\n- `emptyLine` — `│...│`
