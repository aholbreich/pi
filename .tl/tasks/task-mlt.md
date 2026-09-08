---
id: task-mlt
title: Rework README with updated screenshots
status: open
priority: medium
type: chore
created_at: 2026-09-08T18:26:30Z
updated_at: 2026-09-08T18:26:30Z
created_by: pi-agent
assignee: null
depends_on: []
claim:
  actor: null
  claimed_at: null
  expires_at: null
  heartbeat_at: null
tags:
  - docs
  - readme
  - screenshots
references:
  - README.md
  - docs/images/tl-board.png
  - package.json
---

## Description

Rework README.md to reflect the current extension and improve the first-time user experience, with fresh screenshots of the current UI.

Scope:
- Review structure, setup guidance, command and shortcut documentation, and developer workflow against current behavior.
- Replace the outdated board screenshot and add current summary/footer and task-details screenshots where useful.
- Show relevant current behavior such as task grouping, version/compatibility states, and wrapped or scrollable task details without cluttering the README.
- Add clear image captions and descriptive alt text; avoid exposing private information in screenshots.
- Keep screenshot assets and the package gallery preview reference consistent if image paths change.
- Capture screenshots if possible; otherwise ask the user to provide them.

Acceptance criteria:
- README is accurate, concise, and easy for a new user to follow.
- Screenshots show the current UI, are legible, and have useful context.
- Links, image references, commands, and examples are verified.
- Relevant checks and any manual verification limitations are recorded in the task.
