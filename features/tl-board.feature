Feature: Task Ledger board navigation
  As a developer using the coding agent
  I want to browse and act on task ledger tasks through a keyboard-navigable overlay
  So that I can quickly inspect status, prioritize work, and trigger agent workflows without leaving the terminal

  Scenario: Open the board and see tasks grouped by status
    Given a task ledger repository has the following tasks:
      | id          | title          | status        | priority |
      | task-ready  | Deploy staging  | open          | high     |
      | task-active | Fix login bug   | in_progress   | medium   |
      | task-stale  | Old cleanup     | stale          | low      |
    When the task ledger board overlay is opened
    Then the board displays the task "task-ready" under section "Ready"
    And the board displays the task "task-active" under section "In progress"
    And the board displays the task "task-stale" under section "Stale claims"

  Scenario: Dependency-waiting tasks remain visible in the focused board
    Given a task ledger repository has the following tasks:
      | id             | title            | status  | priority | depends-on |
      | task-fetch     | Fetch feeds      | open    | high     |            |
      | task-subscribe | Add sources      | open    | high     | task-fetch |
      | task-finished  | Set up storage   | done    | medium   |            |
    When the task ledger board overlay is opened
    Then the board displays the task "task-subscribe" under section "Waiting"
    And the board does not display the task "task-finished"

  Scenario: All view includes every task including tasks waiting on dependencies
    Given a task ledger repository has the following tasks:
      | id             | title            | status    | priority | depends-on |
      | task-fetch     | Fetch feeds      | open      | high     |            |
      | task-subscribe | Add sources      | open      | high     | task-fetch |
      | task-finished  | Set up storage   | done      | medium   |            |
      | task-cancelled | Old import plan  | cancelled | low      |            |
    And the task ledger board overlay is opened
    When the user presses the "a" key
    Then the board displays the task "task-fetch" under section "Ready"
    And the board displays the task "task-subscribe" under section "Waiting"
    And the board displays the task "task-finished" under section "Done"
    And the board displays the task "task-cancelled" under section "Cancelled"

  Scenario: A ledger without ready tasks still shows waiting work
    Given a task ledger repository has the following tasks:
      | id             | title       | status  | priority | depends-on     |
      | task-subscribe | Add sources | open    | high     | task-discovery |
      | task-discovery | Find feeds  | blocked | high     |                |
    When the task ledger board overlay is opened
    Then the board displays the task "task-subscribe" under section "Waiting"
    And the board displays the task "task-discovery" under section "Blocked"

  Scenario: Readers can inspect the prerequisites of a waiting task
    Given a task ledger repository has the following tasks:
      | id             | title       | status | priority | depends-on |
      | task-fetch     | Fetch feeds | open   | high     |            |
      | task-subscribe | Add sources | open   | high     | task-fetch |
    And the task ledger board overlay is opened
    When the user opens the details of task "task-subscribe"
    Then the board shows "Depends On: task-fetch"

  Scenario: Open the board via the Alt+L keyboard shortcut
    Given a task ledger repository is active
    When the user presses the "Alt+L" shortcut
    Then the task ledger board overlay is visible

  Scenario: Board overlay has a rounded framed panel
    Given the task ledger board is open with a task "task-borders"
    Then the board has a rounded top border with a centered title
    And the board has a rounded bottom border line
    And the task rows are framed with vertical border characters and inner padding
    And the selected task row uses a compact pointer

  Scenario: Cancel a task from the detail view
    Given the task ledger board is open with a task "task-cancel"
    And the user selects that task and opens its details
    When the user requests to cancel that task
    Then the task "task-cancel" is cancelled

  Scenario: Press q in details view returns to list not close the board
    Given the task ledger board is showing task details
    When the user presses the "q" key
    Then the board returns to the list view

  Scenario: Remove a task from the detail view with a reason
    Given the task ledger board is open with a task "task-remove"
    And the user selects that task and opens its details
    When the user requests to remove that task
    Then the task "task-remove" is removed with a reason

  Scenario: Long task details are clipped with a scroll indicator
    Given the task ledger board is open with a task "task-details" and long details
    When the user opens the details of task "task-details"
    Then the board shows the beginning of the details
    And the board does not show the end of the details
    And the board shows a scroll indicator

  Scenario: Scrolling reveals more of long task details
    Given the task ledger board is open with a task "task-details" and long details
    When the user opens the details of task "task-details"
    And the user scrolls the details down
    Then the board shows more of the details
    And the scroll indicator updates

  Scenario: Short task details need no scrolling
    Given the task ledger board is open with a task "task-short"
    When the user opens the details of task "task-short"
    Then the board shows "task-short full details"
    And the board shows no scroll indicator

  Scenario: Summary line shows all section counts including closed sections in focused mode
    Given a task ledger repository has the following tasks:
      | id         | title    | status | priority |
      | task-ready | Deploy   | open   | high     |
      | task-done  | Shipped  | done   | medium   |
    And the task ledger board overlay is opened
    Then the board summary shows a "Ready" count of 1
    And the board summary shows a "Done" count of 1
    And the board summary shows a "Cancelled" count of 0

  Scenario: The summary line is not affected by the focused/all toggle
    Given a task ledger repository has the following tasks:
      | id         | title    | status | priority |
      | task-ready | Deploy   | open   | high     |
      | task-done  | Shipped  | done   | medium   |
    When the task ledger board overlay is opened
    And the user presses the "a" key
    Then the board summary shows a "Done" count of 1
    And the board summary shows a "Cancelled" count of 0
