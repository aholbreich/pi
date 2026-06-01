---
id: task-t0a
title: Task titles truncated in /tl-board row rendering
status: done
priority: medium
type: bug
created_at: 2026-06-01T20:06:08Z
updated_at: 2026-06-01T20:06:48Z
created_by: human
assignee: null
depends_on: []
claim:
  actor: null
  claimed_at: null
  expires_at: null
  heartbeat_at: null
tags:
  - extension
  - ux
  - board
---

## Description

Long task titles are truncated at ~38 characters in the 80-column board overlay because tags consume 15-25 chars of the available row width. Titles like "Ensure Task Ledger summary overlay refreshes after all tl operations" show as "Ensure Task Ledger summary overlay r…". Fix: remove tags from board rows to give more room to titles.

## Notes

- 2026-06-01T20:06:48Z [pi-agent] note: Removed tags from /tl-board list and details row rendering. This frees ~15-25 chars for task titles, fixing truncation of long titles. Updated unit test assertion. All tests pass.
