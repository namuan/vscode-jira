# Changelog

All notable changes to the "VSCode JIRA Integration" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2024-01-15

### Added
- 🎉 Initial release of VSCode JIRA Integration
- 🔐 Secure authentication with Jira Cloud using API tokens
- 📋 Complete issue management system
  - View and browse issues in categorized sidebar
  - Create new issues with project and type selection
  - Update issue status using available transitions
  - Add comments to issues with real-time updates
  - Assign issues to users (self or others)
- 🔍 Advanced search and filtering capabilities
  - JQL (Jira Query Language) support
  - Simple text search with automatic JQL conversion
  - Predefined filters for common workflows
  - Custom search with up to 100 results
- 🎯 Rich user interface
  - Dedicated Jira sidebar panel with issue categories
  - Comprehensive issue detail webview
  - Color-coded priority indicators
  - Status-based icons and visual cues
  - Interactive tooltips with detailed information
- ⚡ Quick Actions system
  - Command palette integration
  - One-click access to all Jira operations
  - Keyboard shortcut support
- 🛠️ Developer experience
  - TypeScript codebase with strict typing
  - Comprehensive test suite with mocked API
  - Webpack bundling for optimized performance
  - ESLint configuration for code quality
- 🔒 Security features
  - Secure credential storage using VSCode Secrets API
  - Automatic credential validation and refresh
  - No logging of sensitive information
  - HTTPS-only API communication
- 📊 Error handling and reliability
  - Automatic retry logic with exponential backoff
  - Graceful error handling with user-friendly messages
  - Network timeout protection
  - Connection status monitoring

### Technical Implementation
- **Authentication System**: `JiraAuthProvider` with secure credential management
- **API Client**: `JiraApiClient` with full REST API v3 integration
- **UI Provider**: `JiraIssueProvider` for sidebar tree view
- **Commands**: 13 registered commands for all operations
- **Testing**: Complete test suite with Sinon mocks and Mocha framework
- **Build System**: Webpack configuration with TypeScript compilation

### Supported Operations
- Authenticate with Jira Cloud
- View assigned issues in categorized display
- Search issues using JQL or text queries
- Filter issues with predefined filters
- Create new issues with full metadata
- Update issue status and transitions
- Add comments to issues
- Assign/unassign issues
- Check connection status
- Refresh issue data
- Clear stored credentials

### Dependencies
- **Runtime**: axios for HTTP requests
- **Development**: TypeScript, Webpack, ESLint, Mocha, Sinon
- **VSCode**: Minimum version 1.74.0
- **Node.js**: Minimum version 16.x

### Known Limitations
- Jira Cloud only (Server/Data Center not supported)
- Basic field support (custom fields in future release)
- English language only
- No offline mode (planned for future release)

---

## [Unreleased]

### Planned Features
- [ ] Offline mode with local caching
- [ ] Custom JQL query builder UI
- [ ] Bulk operations for multiple issues
- [ ] Integration with Git commits
- [ ] Custom field support
- [ ] Agile board integration
- [ ] Time tracking features
- [ ] Advanced reporting and analytics
- [ ] Multi-language support
- [ ] Jira Server/Data Center support
- [ ] Issue templates
- [ ] Workflow automation
- [ ] Advanced filtering UI
- [ ] Export functionality
- [ ] Integration with other Atlassian products

---

## Release Notes Format

### Categories
- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements

### Emoji Guide
- 🎉 Major release
- ✨ New feature
- 🔧 Enhancement
- 🐛 Bug fix
- 🔒 Security
- 📚 Documentation
- 🚀 Performance
- 💥 Breaking change
- 🗑️ Deprecation
- 🔥 Removal