@tl-init @tl-git-build
Feature: Task Ledger Git build compatibility
  As a developer running a source build of Task Ledger
  I want compatibility checks to recognize the CLI's Git build suffix
  So that a build based on a supported release does not produce a false upgrade warning

  Scenario Outline: A supported release's Git build initializes without an upgrade warning
    Given the initialization CLI version is "<version>"
    When the user confirms Task Ledger initialization
    Then the user receives no compatibility warning
    And the task ledger is initialized

    Examples:
      | version               |
      | 0.9.0-0-db9cd9b        |
      | 0.9.0-12-db9cd9b       |
      | 0.9.0-0-db9cd9b+local  |
      | 0.10.0-3-db9cd9b       |

  Scenario Outline: A Git suffix does not promote an older release or a prerelease to supported
    Given the initialization CLI version is "<version>"
    When the user confirms Task Ledger initialization
    Then the user receives an upgrade warning mentioning "0.9.0"
    And the task ledger is initialized

    Examples:
      | version               |
      | 0.8.1-99-db9cd9b       |
      | 0.9.0-rc.1            |
      | 0.9.0-rc.1-0-db9cd9b   |
