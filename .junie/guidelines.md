# Project Development Guidelines (Advanced)

This document captures project-specific knowledge needed to build, test, debug, and extend the VSCode Jira Integration extension efficiently. It assumes familiarity with VSCode extension development, TypeScript, Mocha, and the VS Code Test Runner (@vscode/test-electron).


## Environment and Toolchain
- Node.js: 16.x (aligned with @types/node 16.x and VS Code test harness)
- VS Code Engine: ^1.74.0 (see package.json engines.vscode)
- TypeScript: ^4.9.x with strict enabled (see tsconfig.json)
- Bundler: Webpack 5 (single entry: src/extension.ts → dist/extension.js)
- Linting: ESLint 8 + @typescript-eslint (lint target: src/**/*.ts)
- Test Runner: Mocha (via @vscode/test-electron) executing within a VS Code instance


## Build and Configuration

1) Install dependencies
- npm install

2) Development builds
- npm run watch  # webpack in watch mode
- npm run compile  # one-off build

3) Production bundle
- npm run package  # webpack production mode + hidden source map
- Output: dist/extension.js (main entry in package.json)

4) VSIX packaging and local install
- npm run package-extension  # produces .vsix
- npm run publish-extension  # publishes to Marketplace (requires publisher auth)
- npm run install-local      # installs any *.vsix in repo into your local VS Code

5) TypeScript configuration (tsconfig.json)
- target: ES2020, module: commonjs, rootDir: src, outDir: out (for tests/runtime TS transpilation)
- strict: true, esModuleInterop: true, skipLibCheck: true

6) Webpack configuration (webpack.config.js)
- target: node (VSCode extension host)
- externals: { vscode: 'commonjs vscode' }
- devtool: nosources-source-map suitable for Marketplace validation


## Testing

The project uses VS Code’s Electron test harness to run Mocha tests inside an actual VS Code instance. Test orchestration lives in src/test/runTest.ts and src/test/suite/index.ts.

- Scripts
  - npm test            # compiles TS, bundles extension, lints, then launches test VS Code and runs Mocha
  - npm run compile-tests  # transpiles tests to out/
  - npm run watch-tests    # watch mode for out/ build of tests (useful in long edit sessions)

- Pretest chain (package.json)
  - pretest → compile-tests → compile → lint → test
  - If linting fails, tests won’t run. Ensure rules are valid and code is formatted.

- Test discovery
  - src/test/suite/index.ts auto-discovers all files matching suite/**/*.test.js (compiled JS) and adds them to Mocha. This was adjusted to avoid hardcoding a single test file.
  - Author tests as TypeScript under src/test/suite/**/*.test.ts; they’ll be compiled to out/test/suite/**/*.test.js by compile-tests.

- Where tests run
  - Tests execute in a VS Code instance spawned by @vscode/test-electron. If your test needs the extension active (commands registered), explicitly acquire and activate it via:
    const ext = vscode.extensions.getExtension('namuan.vscode-jira-integration');
    await ext?.activate();

- Existing comprehensive tests
  - src/test/suite/extension.test.ts includes API stubbing (sinon), auth flow stubs, provider checks, command registration verification, and an integration-style happy path. Prefer using those patterns for new tests.

- Common pitfalls
  - Extension identifier: Use 'namuan.vscode-jira-integration' (publisher.name from package.json). Tests must use this exact ID when retrieving the extension.
  - Lint gate: pretest runs ESLint. Keep .eslintrc.json valid; non-existent naming-convention selectors (e.g., selector: 'import') will break the pipeline.
  - Activation events: Activation is command-triggered. Tests that assert on commands should first await extension activation.


### Adding a New Test (Example)

1) Create a new test file in TypeScript
- File: src/test/suite/foo.example.test.ts
- Example:

  import * as assert from 'assert';
  import * as vscode from 'vscode';

  suite('Example Suite', () => {
    test('extension loads', async () => {
      const ext = vscode.extensions.getExtension('namuan.vscode-jira-integration');
      assert.ok(ext);
      await ext?.activate();
      assert.ok(ext?.isActive);
    });
  });

2) Compile and run
- npm test
- The runner will transpile to out/test/suite/foo.example.test.js and auto-discover it.

3) Remove temporary tests (if they’re only for demonstration)
- Delete the file from src/test/suite/ once done. Keep the suite clean and tests meaningful.


### Verified Test Run (as of 2025-08-28 21:41 local)

- Adjusted test discovery to glob suite/**/*.test.js and fixed the extension identifier in tests.
- Executed npm test successfully: 21 passing, 0 failing on local run.
- A temporary smoke test was used only to demonstrate the process and has been removed after verification.


## Debugging and Developer Experience

- Launching in Extension Development Host
  - Open in VS Code → Run and Debug → Run Extension (or F5). This spawns a second VS Code window with the extension loaded.
  - Reload the Extension Host window with Cmd+R/Ctrl+R after code changes.

- Logging
  - The extension currently uses vscode.window messaging and console logs for observability. Consider adding a structured OutputChannel logger for deeper diagnostics (see docs/tasks.md item 10).

- Authentication & API
  - Auth is handled by JiraAuthProvider; API calls by JiraApiClient. Tests stub these using sinon to avoid network calls. Follow existing stubbing patterns when adding features.

- Commands and Views
  - Commands are registered in activate() (src/extension.ts). Ensure new commands get pushed into context.subscriptions and have clear error notifications. The tree view id is 'jiraIssues' and is gated via setContext('jira:authenticated', true).


## Code Style and Conventions

- TypeScript strict mode is enabled; avoid any. Prefer strong typing of Jira entities and narrow types at boundaries.
- ESLint rules are lightweight by design (semi, curly, eqeqeq, no-throw-literal). Keep the ruleset valid. If adding @typescript-eslint/naming-convention, use supported selectors (e.g., variableLike, typeLike) only.
- Project aims to evolve toward stricter models and better layering (see docs/tasks.md). When touching API/auth/providers, consider the roadmap items for incremental improvements.


## Useful References in Repo
- README.md → comprehensive user and developer guidance
- DEVELOPER_TESTING.md → detailed manual and automated testing guide, scenarios, and CI suggestions
- .github/copilot-instructions.md → concise architecture and workflow primer
- docs/tasks.md → prioritized engineering improvements and testability roadmap


## Notes for Future Workflows
- CI can run npm run compile, npm test, and npm run lint on push/PR (see DEVELOPER_TESTING.md example workflow). Ensure GitHub runners use Node 16.
- Consider adding coverage tooling (nyc/istanbul) and a test:coverage script if/when needed; it is referenced in DEVELOPER_TESTING.md but not currently wired in package.json.
- Where tests depend on VS Code version behavior, match the engine in package.json to the test harness version used by @vscode/test-electron to avoid API drift.
