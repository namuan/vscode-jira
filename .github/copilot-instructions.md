# Copilot Instructions for vscode-jira

These instructions are intended to help AI coding agents quickly understand and work with the vscode-jira codebase. This document summarizes the architecture, key modules, workflows, and integration points that are critical for maintaining and enhancing this project.

## Overview
- **Project Type:** Visual Studio Code extension for Jira integration.
- **Primary Language:** TypeScript
- **Key Entry Point:** `src/extension.ts`

## Architecture & Modules
- **Core Extension:**
  - `src/extension.ts` bootstraps the extension and registers commands.
- **API Integration:**
  - `src/api/jiraApiClient.ts` handles communication with Jira's REST API.
- **Authentication:**
  - `src/auth/jiraAuthProvider.ts` manages authentication for connecting to Jira.
- **Issue Provisioning:**
  - `src/providers/jiraIssueProvider.ts` integrates Jira issues into the VS Code UI.
- **Testing:**
  - Located under `test/` (e.g., `test/runTest.ts`, `test/suite/extension.test.ts`) and uses project-specific test runners and configurations.

## Developer Workflows
- **Building and Compiling:**
  - Use `npm run compile` to compile the project.
  - A background watch task is available via `npm run watch` for real-time compilation.
- **Testing:**
  - Tests can be run using the scripts defined in `package.json` and the code in the `test/` directory.
- **Debugging:**
  - Leverage VS Code debugging features; key breakpoints can be set in modules such as the Jira API client or authentication provider.

## Project-Specific Conventions & Patterns
- **Modular Design:**
  - Each major functional area (API, Auth, Issue Provider) is isolated into its own module under the `src/` directory.
- **Type Usage:**
  - Consistent use of TypeScript for type safety; refer to `tsconfig.json` for compiler options.
- **Build Configuration:**
  - Webpack is used for bundling as defined in `webpack.config.js`.
- **Code Quality:**
  - Follow patterns observed in `src/` files; e.g., async error handling in `jiraApiClient.ts` and clear separation of concerns in authentication.

## Integration Points & External Dependencies
- **Jira REST API:**
  - Directly integrated via the API client; inspect `src/api/jiraApiClient.ts` for request structures and endpoints.
- **VS Code APIs:**
  - Standard VS Code extension APIs are used primarily in `src/extension.ts` for command registration and UI integration.

## Additional Guidance
- **Documentation:**
  - Review `README.md` and `DEVELOPER_TESTING.md` for additional context on setup and testing procedures.
- **Examples in Codebase:**
  - Use the implementation in `src/auth/jiraAuthProvider.ts` as a reference for secure authentication flow patterns.
- **Agent Specific Tips:**
  - When modifying code, look at the division of responsibilities across modules. Merged changes should adhere to existing patterns observed in `src/`.

---

Please review these instructions and provide feedback if any sections are unclear or if further details are required for immediate productivity with the codebase.
