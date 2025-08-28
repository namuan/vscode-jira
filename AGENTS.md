# AGENTS.md
This file provides guidance to agents when working with code in this repository.

## Build and Test Commands
- Compile the extension: `npm run compile`
- Watch for changes: `npm run watch`
- Run linting: `npm run lint`
- Run tests: `npm run test` (which executes `node ./out/test/runTest.js`)
- Pre-test setup: `npm run pretest` (compiles tests and lints)
- Package the extension: `npm run package-extension`
- Publish the extension: `npm run publish-extension`

## Code Style Guidelines
- Use TypeScript with strict mode enabled (tsconfig.json).
- Naming conventions: camelCase for variables, PascalCase for classes (from .eslintrc.json).
- Error handling: Implement retry logic for network errors in API calls (JiraApiClient).
- Imports: Use relative paths and avoid circular dependencies.

## Project-Specific Patterns
- Jira API integration: Axios with retry mechanism for robustness.
- Authentication: User prompts and secure storage of credentials using VSCode's secret system.
- Issue display: Tree view with status-based categorization for better navigation.

## Testing
- Use Mocha for unit tests and Sinon for mocking dependencies.
- Integration tests cover authentication, API calls, and command execution with comprehensive mock data.