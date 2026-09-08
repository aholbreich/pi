@title-wrap
Feature: Task title wrapping in board overlay

  As a user viewing the task ledger board,
  I want long task titles to wrap to the next line instead of being truncated,
  so I can read the full title without opening the task details.

  Background:
    Given the task ledger board overlay is open
    And at least one task has a title longer than the available line width

  Scenario: Short title renders on a single line
    When a task title fits within the remaining line width after prefix (icon, id, priority)
    Then the title is shown in full on one line
    And no continuation lines are rendered

  Scenario: Long title wraps to continuation lines
    When a task title exceeds the remaining line width after prefix
    Then the title is split at word boundaries
    And continuation lines are indented to align with the title start position
    And no ellipsis (`…`) truncation is applied

  Scenario: Continuation lines don't repeat entry prefix
    When a title wraps to continuation lines
    Then continuation lines show only the wrapped title text with indent spacing
    And continuation lines do NOT show the section icon, task ID, or priority icon again

  Scenario: Selected entry with wrapped title
    When a task with a wrapped title is selected
    Then all lines of that entry are highlighted with the accent color
    And continuation lines are styled consistently with the first line

  Scenario: Scrolling still works with multi-line entries
    When some entries wrap to multiple lines
    Then navigation (up/down) moves between entries as before
    And the scroll offset is entry-based, not line-based
