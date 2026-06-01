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
