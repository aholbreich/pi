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
    And the board returns to the list view

  Scenario: Press q in details view returns to list not close the board
    Given the task ledger board is showing task details
    When the user presses the "q" key
    Then the board returns to the list view

  Scenario: Remove a task from the detail view with a reason
    Given the task ledger board is open with a task "task-remove"
    And the user selects that task and opens its details
    When the user requests to remove that task
    Then the task "task-remove" is removed with a reason
    And the board returns to the list view
