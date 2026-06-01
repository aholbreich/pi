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

  Given the task ledger board is open with multiple tasks
    When the user presses the down arrow key twice
    Then the third task in the list is selected

  Scenario: Navigate the task list with j and k keys
    Given the task ledger board is open with multiple tasks
    When the user presses the "j" key
    Then the next task in the list is selected

  Scenario: Display the selected task ID in the board title
    Given the task ledger board is open with a task "task-ready"
    When the user selects that task
    Then the board title line includes the text "task-ready"

  Scenario: Open task details from the board
    Given the task ledger board is open with a task "task-ready"
    When the user selects that task and opens its details
    Then the detail modal shows full task information for "task-ready"
    And the help line indicates that "b" or "esc" returns to the list view

  Scenario: Return from task details to list view
    Given the task ledger board is showing task details
    When the user presses the "b" key
    Then the board returns to the list view

  Scenario: Request implementation of a selected task from the board
    Given the task ledger board is open with a task "task-ready"
    When the user selects that task and requests "implement"
    Then the agent receives an implement workflow request for "task-ready"

  Scenario: Close the board without selecting a task
    Given the task ledger board is open
    When the user presses the "q" key
    Then the board overlay closes
    And no workflow request is sent to the agent

  Scenario: Open the board via the Alt+L keyboard shortcut
    Given a task ledger repository is active
    When the user presses the "Alt+L" shortcut
    Then the task ledger board overlay is visible

  Scenario: Board overlay has a framed panel with borders and padding
    Given the task ledger board is open with a task "task-borders"
    Then the board has a top border line using box-drawing characters
    And the board has a bottom border line using box-drawing characters
    And the task rows are framed with vertical border characters and inner padding

  Scenario: Toggle between focused and all-mode view
    Given the task ledger board is open with multiple tasks
    When the user presses the "a" key
    Then the help line shows "a focused view" to indicate all-mode is active
    And the board shows a "Done" section
    And the board shows a "Cancelled" section

  Scenario: Toggle back from all-mode to focused view
    Given the task ledger board is open with multiple tasks
    And the user presses the "a" key to enter all-mode
    When the user presses the "a" key again
    Then the help line shows "a show all" to indicate focused mode is active
    And the board does not show a "Done" section

  Scenario: Cancel a task from the detail view
    Given the task ledger board is open with a task "task-cancel"
    And the user selects that task and opens its details
    When the user requests to cancel that task
    Then the task "task-cancel" is cancelled
    And the board returns to the list view
