# Improvement Tasks Checklist

A logically ordered, actionable plan to improve architecture, code quality, security, performance, testability, and maintainability of the VSCode Jira Integration extension. Check items off as they are completed.

1. [ ] Establish engineering foundations
   - [ ] Set up Prettier and align with ESLint (add config, scripts, and CI checks)
   - [ ] Enforce TypeScript strictness across project (verify noImplicitAny, exactOptionalPropertyTypes if viable)
   - [ ] Introduce EditorConfig for consistent whitespace and line-endings
   - [ ] Add Husky + lint-staged to run lint/format on commit
   - [ ] Define CODEOWNERS and contribution guidelines updates in README/CONTRIBUTING.md

2. [ ] Testing infrastructure and coverage
   - [ ] Create tests folder structure (unit/integration) and seed with sample tests for api/auth/providers
   - [ ] Set up test coverage tooling (nyc/istanbul) with coverage thresholds in CI
   - [ ] Add mocking/stubbing utilities for axios and vscode APIs
   - [ ] Add a GitHub Actions CI workflow to run build, lint, and tests on pushes and PRs
   - [ ] Add tests for retry/backoff behavior and error mapping in JiraApiClient

3. [ ] Secrets and credential management
   - [ ] Migrate credential storage to VSCode SecretStorage (vscode.SecretStorage) instead of any local/global state
   - [ ] Implement secure migration path for existing users (detect old storage, migrate, purge)
   - [ ] Add redact/scrub logic for logs to prevent leaking tokens/emails
   - [ ] Document security model in docs/SECURITY.md

4. [ ] Configuration and settings
   - [ ] Define a schema for extension settings in package.json (base URL, default JQLs, pagination size, timeouts, retry counts, debug)
   - [ ] Centralize config access via a ConfigService with change listeners
   - [ ] Provide validation for settings (e.g., URL format) and helpful error messages

5. [ ] API client hardening (src/api/jiraApiClient.ts)
   - [ ] Extract HTTP layer and Axios instance creation into a dedicated HttpClient factory with interceptors
   - [ ] Add cancellable requests using AbortController and VSCode CancellationToken where applicable
   - [ ] Implement exponential backoff with jitter and max retry caps for retryable errors
   - [ ] Introduce rate-limit (429) handling with Retry-After header support
   - [ ] Standardize error mapping to user-friendly messages and error codes
   - [ ] Add request/response timeouts and sane defaults from configuration
   - [ ] Add pagination helpers and lazy loading for large result sets
   - [ ] Strengthen TypeScript models for Jira entities (Issue, Fields, Transitions, User) with partials and guards

6. [ ] Authentication flow (src/auth/jiraAuthProvider.ts)
   - [ ] Validate inputs with stricter rules (URL normalization, email format, token length)
   - [ ] Add base URL auto-detection helper and guidance (e.g., .atlassian.net)
   - [ ] Implement revalidation policy with memoized last-success timestamps and jitter to avoid thundering herd
   - [ ] Provide a non-blocking background validation with status notification instead of modal prompts when possible
   - [ ] Support multiple Jira profiles and a quick picker to switch between them

7. [ ] Extension activation and command structure (src/extension.ts)
   - [ ] Refactor monolithic activate() into smaller feature modules/services (AuthService, IssueService, CommandRegistrar)
   - [ ] Introduce Dependency Injection (simple container/factory) to decouple services
   - [ ] Centralize command registration and error handling wrappers
   - [ ] Ensure all commands are idempotent and provide consistent UX with progress notifications
   - [ ] Add disposal and teardown paths for all registered resources

8. [ ] Tree/Data providers (src/providers/jiraIssueProvider.ts)
   - [ ] Separate presentation (TreeItem creation) from data fetching (provider service)
   - [ ] Cache and debounce refreshes; avoid redundant API calls
   - [ ] Add partial loading states and empty/error state differentiation
   - [ ] Improve icons and theming support via codicons and context values
   - [ ] Add sorting and filtering strategies (configurable)

9. [ ] Webview and UI hardening
   - [ ] Move inline HTML to a templating helper and use vscode-resource URIs
   - [ ] Enforce strict Content Security Policy (CSP) with nonce; remove/avoid inline scripts/styles
   - [ ] Sanitize any user-generated content rendered in webviews (comments, descriptions)
   - [ ] Add light/dark theme awareness and high-contrast support
   - [ ] Provide accessible semantics (aria labels, roles) and keyboard navigation

10. [ ] Observability and diagnostics
    - [ ] Create a Logger utility with log levels (debug/info/warn/error) writing to OutputChannel
    - [ ] Add structured error context (operation, issueKey, status code) to logs
    - [ ] Add optional telemetry events with a privacy-respecting toggle (no PII)
    - [ ] Add a command to export diagnostic bundle (versions, settings, logs)

11. [ ] Performance improvements
    - [ ] Add result caching with TTL for stable queries and list endpoints
    - [ ] Batch sequential API calls where possible; parallelize independent calls with concurrency caps
    - [ ] Implement lazy-loading for large issue lists (pagination in tree)
    - [ ] Measure and log slow operations; surface durations in debug mode

12. [ ] Error handling and UX consistency
    - [ ] Standardize user notifications via a NotificationService (info/warn/error) with actionable buttons
    - [ ] Provide retry actions in notifications for transient failures
    - [ ] Map common Jira error scenarios (401/403/404/429/5xx) to clear guidance
    - [ ] Localize all user-facing strings with i18n scaffolding (future-ready)

13. [ ] Type safety and domain models
    - [ ] Create a shared types module for Jira domain (Issue, Project, Transition, User, Comment)
    - [ ] Add runtime type guards (io-ts/zod or custom) where API responses are uncertain
    - [ ] Avoid any and unknown by modeling minimal safe subsets with extensible interfaces

14. [ ] Security and privacy
    - [ ] Review and minimize scopes and data stored
    - [ ] Ensure no secrets are logged; add tests for log scrubbing
    - [ ] Audit third-party dependencies (npm audit / dependabot) and lockfile updates
    - [ ] Document data handling and privacy in README/docs

15. [ ] Packaging and release
    - [ ] Add vsce package validation step in CI
    - [ ] Automate changelog generation (Conventional Commits + changelog tooling)
    - [ ] Add semantic versioning and release notes template
    - [ ] Provide a signed VSIX and publish pipeline (manual approval gate)

16. [ ] Documentation
    - [ ] Expand README with troubleshooting matrix, common errors, and FAQs (link to diagnostics)
    - [ ] Add developer docs for architecture (docs/ARCHITECTURE.md) including module diagram
    - [ ] Add docs for configuration options and examples (docs/CONFIGURATION.md)
    - [ ] Add contribution guide (CONTRIBUTING.md) and test strategy docs (docs/TESTING.md)

17. [ ] Maintainability and cleanliness
    - [ ] Reduce function lengths in src/extension.ts by extracting helpers and modules
    - [ ] Enforce cyclomatic complexity limits via ESLint rules and report
    - [ ] Remove dead code and add TODO annotations with owners
    - [ ] Introduce strict public API surfaces for modules (index.ts re-exports)

18. [ ] Future enhancements groundwork
    - [ ] Design an abstraction for offline caching to enable the roadmap "Offline mode"
    - [ ] Define a QueryBuilder interface for future "Custom JQL builder UI"
    - [ ] Plan data synchronization and conflict resolution strategies for offline edits
