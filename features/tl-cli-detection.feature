@tl-cli
Feature: Task Ledger CLI detection
  As a developer using the Task Ledger extension
  I want the extension to recognize the installed CLI and its version
  So that setup guidance can distinguish an unavailable CLI from an unknown version

  Scenario Outline: The installed version appears in the summary status
    Given the Task Ledger CLI reports version "<version>"
    When the task summary refreshes
    Then the task summary status includes "tl <version>:"

    Examples:
      | version        |
      | 0.9.0          |
      | 0.9.0-0-db9cd9b |

  Scenario Outline: An unusable CLI is reported as unavailable
    Given the Task Ledger CLI is unusable because "<reason>"
    When the extension checks the CLI installation
    Then the CLI is reported as unavailable
    And the installed CLI version is unknown

    Examples:
      | reason                   |
      | the executable is absent |
      | the command fails        |
      | the command times out    |

  Scenario: An unrecognized version does not imply a missing executable
    Given the Task Ledger CLI reports an unrecognized version
    When the extension checks the CLI installation
    Then the CLI is reported as available
    And the installed CLI version is unknown

  Scenario: An unknown version is shown as incompatible
    Given the Task Ledger CLI reports an unrecognized version
    When the task summary refreshes
    Then the task summary status is "tl: incompatible"
