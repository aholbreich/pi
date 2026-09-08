@overlay-actions
Feature: Overlay action target
  As a developer using the Task Ledger overlay
  I want the action legend to belong visually to its target task
  So that I know which task the shortcuts act on

  Scenario: Actions belong to the first Ready task rather than a separate list entry
    Given the action overlay contains these tasks:
      | id          | title                         | section |
      | task-scope  | Plan tree feature support     | Pending |
      | task-review | Human review of all actions   | Ready   |
      | task-layout | Check the overlay layout      | Ready   |
    When the action overlay is rendered
    Then the dim action legend is nested beneath "task-review"
    And the action legend continues the outer tree toward the next task
    And the final task branch belongs to "task-layout"

  Scenario: Actions remain attached when their target is the last task
    Given the action overlay contains these tasks:
      | id          | title                       | section |
      | task-review | Human review of all actions | Ready   |
    When the action overlay is rendered
    Then the dim action legend is nested beneath "task-review"
    And the action legend has no dangling outer tree connector
    And the final task branch belongs to "task-review"

  Scenario: No action legend appears without a Ready task
    Given the action overlay contains these tasks:
      | id         | title                     | section |
      | task-scope | Plan tree feature support | Pending |
    When the action overlay is rendered
    Then the action overlay shows no action legend
