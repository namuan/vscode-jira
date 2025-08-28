# AGENTS.md (Architect Mode)
This file provides architectural constraints.

- Providers must be stateless.
- Webview communication uses webview.postMessage.
- No direct database access; use Jira API only.