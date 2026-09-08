Feature: Task Ledger footer status states
  As a developer using the coding agent
  I want the footer status to reflect the tl CLI availability and compatibility
  So that I can tell at a glance whether the task ledger is usable

  Scenario: tl CLI is missing
    Given the tl CLI is not on PATH
    When the task ledger overlay refreshes
    Then the footer status shows "tl: not found" in "error" color

  Scenario: tl CLI version is incompatible
    Given the tl CLI reports version "0.6.0"
    When the task ledger overlay refreshes
    Then the footer status shows "tl 0.6.0: incompatible" in "warning" color

  Scenario: tl CLI is compatible but the ledger is not initialized
    Given the tl CLI reports version "0.9.0"
    And no task ledger directory exists
    When the task ledger overlay refreshes
    Then the footer status shows "tl 0.9.0: no ledger" in "dim" color

  Scenario: tl CLI is compatible and the ledger is initialized with no tasks
    Given the tl CLI reports version "0.9.0"
    And a task ledger directory exists with no tasks
    When the task ledger overlay refreshes
    Then the footer status shows "tl 0.9.0: 0r" in "dim" color
