@tl-init
Feature: Task Ledger initialization compatibility guidance
  As a developer setting up Task Ledger
  I want a warning when the CLI is older than the supported minimum
  So that I can choose to upgrade without losing the option to initialize

  Scenario Outline: An older CLI warns without preventing initialization
    Given the initialization CLI version is "<version>"
    When the user confirms Task Ledger initialization
    Then the user receives an upgrade warning mentioning "0.9.0"
    And the task ledger is initialized

    Examples:
      | version       |
      | 0.8.1         |
      | 0.9.0-rc.1    |

  Scenario Outline: A supported CLI initializes without a compatibility warning
    Given the initialization CLI version is "<version>"
    When the user confirms Task Ledger initialization
    Then the user receives no compatibility warning
    And the task ledger is initialized

    Examples:
      | version       |
      | 0.9.0         |
      | 0.9.0+build.2 |
      | 0.10.0        |

  Scenario: An unknown CLI version does not prevent initialization
    Given the initialization CLI version is "dev"
    When the user confirms Task Ledger initialization
    Then the user is told that CLI compatibility cannot be verified
    And the task ledger is initialized

  Scenario: An existing ledger still receives compatibility guidance
    Given the initialization CLI version is "0.8.1"
    And the task ledger is already initialized
    When the user requests Task Ledger initialization
    Then the user receives an upgrade warning mentioning "0.9.0"
    And the task ledger is not reinitialized

  Scenario: Declining initialization leaves the repository unchanged
    Given the initialization CLI version is "0.8.1"
    When the user declines Task Ledger initialization
    Then the task ledger is not initialized

  Scenario: An unavailable CLI provides manual installation guidance
    Given the initialization CLI is unavailable
    When the user requests Task Ledger initialization
    Then the user receives official CLI installation guidance
    And the task ledger is not initialized
