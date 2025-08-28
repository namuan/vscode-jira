# VSCode JIRA Integration

[![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)](https://github.com/your-repo/vscode-jira-integration)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![VSCode](https://img.shields.io/badge/VSCode-1.74+-blue.svg)](https://code.visualstudio.com/)

A comprehensive VSCode extension that integrates with Jira Cloud to enhance developer productivity by allowing direct interaction with Jira issues from within the IDE.

## 🚀 Features

### Core Functionality
- **🔐 Secure Authentication**: Connect to Jira Cloud using API tokens with automatic credential validation
- **📋 Issue Management**: View, search, filter, and manage Jira issues directly in VSCode
- **➕ Create Issues**: Create new Jira issues with project selection, issue types, and priority settings
- **🔄 Status Updates**: Change issue status using available transitions
- **💬 Comments**: Add comments to issues with real-time updates
- **👤 Assignment**: Assign issues to yourself or other team members
- **🔍 Advanced Search**: Use JQL queries or simple text search to find issues
- **🗂️ Smart Filtering**: Apply predefined filters for common workflows

### User Interface
- **🎯 Sidebar Integration**: Dedicated Jira panel with categorized issue display
- **📱 Issue Details**: Rich webview with comprehensive issue information
- **⚡ Quick Actions**: Command palette integration for fast operations
- **🎨 Visual Indicators**: Color-coded priorities and status-based icons
- **📊 Progress Tracking**: Real-time progress indicators for operations

## 📦 Installation

### From VSCode Marketplace
1. Open VSCode
2. Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for "VSCode JIRA Integration"
4. Click "Install"

### Manual Installation
1. Download the `.vsix` file from releases
2. Open VSCode
3. Run `Extensions: Install from VSIX...` from Command Palette
4. Select the downloaded file

## ⚙️ Setup & Configuration

### 1. Generate Jira API Token
1. Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Give it a descriptive name (e.g., "VSCode Integration")
4. Copy the generated token (you won't see it again!)

### 2. Configure Extension
1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run `Jira: Authenticate with Jira`
3. Enter your details:
   - **Base URL**: Your Jira instance URL (e.g., `https://your-company.atlassian.net`)
   - **Email**: Your Atlassian account email
   - **API Token**: The token you generated above

### 3. Verify Connection
Run `Jira: Check Jira Connection Status` to verify your setup.

## 🎯 Usage Guide

### Quick Start
1. **Authenticate**: Use `Jira: Authenticate with Jira`
2. **View Issues**: Check the Jira sidebar panel or run `Jira: View Jira Issues`
3. **Create Issue**: Use `Jira: Create Jira Issue` for new issues
4. **Quick Actions**: Access `Jira: Jira Quick Actions` for all operations

### Available Commands

| Command | Description | Shortcut |
|---------|-------------|----------|
| `Jira: Authenticate with Jira` | Set up Jira connection | - |
| `Jira: Check Jira Connection Status` | Verify connection and show user info | - |
| `Jira: Clear Jira Credentials` | Remove stored credentials | - |
| `Jira: Jira Quick Actions` | Access all Jira operations | - |
| `Jira: View Jira Issues` | Browse assigned issues | - |
| `Jira: Search Issues` | Search using JQL or text | - |
| `Jira: Filter Issues` | Apply predefined filters | - |
| `Jira: Create Jira Issue` | Create new issue | - |
| `Jira: Update Issue Status` | Change issue status | - |
| `Jira: Add Comment to Issue` | Add comment to issue | - |
| `Jira: Assign Issue` | Assign issue to user | - |
| `Jira: Refresh Issues` | Refresh issue list | - |

### Sidebar Panel Features

#### Issue Categories
Issues are automatically organized into categories:
- **In Progress**: Currently active issues
- **To Do**: Open and backlog issues  
- **Review**: Issues in review or testing
- **Done**: Completed issues

#### Issue Information
Each issue displays:
- **Key and Summary**: Issue identifier and title
- **Status**: Current workflow status
- **Priority**: Issue priority level
- **Assignee**: Person responsible
- **Type Icon**: Visual indicator of issue type

#### Interactive Features
- **Click to Open**: Click any issue to view details
- **Rich Tooltips**: Hover for comprehensive information
- **Context Actions**: Right-click for quick operations

### Issue Detail View

The webview provides:
- **Complete Metadata**: All issue fields and properties
- **Recent Comments**: Last 5 comments with authors and dates
- **Action Buttons**: Quick access to common operations
- **Real-time Updates**: Automatic refresh after changes

### Search & Filtering

#### JQL Search
Use Jira Query Language for advanced searches:
```jql
project = "MY_PROJECT" AND status = "In Progress" AND assignee = currentUser()
```

#### Text Search
Simple text searches are automatically converted to JQL:
- Search: `bug login` → JQL: `text ~ "bug login" OR summary ~ "bug login"`

#### Predefined Filters
- **My Issues**: Issues assigned to you
- **My Watched Issues**: Issues you're watching
- **My Reported Issues**: Issues you created
- **In Progress**: All active issues
- **Open Issues**: All open issues
- **Bugs**: All bug-type issues
- **High Priority**: Critical and high priority issues
- **Recently Updated**: Issues updated in last 7 days

## 🔧 Advanced Configuration

### Workspace Settings
Add to your workspace `.vscode/settings.json`:

```json
{
  "jira.defaultProject": "MY_PROJECT",
  "jira.defaultIssueType": "Task",
  "jira.maxResults": 100,
  "jira.autoRefresh": true,
  "jira.refreshInterval": 300000
}
```

### Keyboard Shortcuts
Add custom shortcuts in `keybindings.json`:

```json
[
  {
    "key": "ctrl+shift+j",
    "command": "jira.quickActions"
  },
  {
    "key": "ctrl+shift+i",
    "command": "jira.viewIssues"
  }
]
```

## 🛠️ Development

### Prerequisites
- **Node.js**: 16.x or higher
- **VSCode**: 1.74.0 or higher
- **Git**: For version control

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/your-repo/vscode-jira-integration.git
cd vscode-jira-integration

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Run tests
npm test
```

### Building and Testing

```bash
# Development build with watch mode
npm run watch

# Production build
npm run package

# Run linting
npm run lint

# Compile tests
npm run compile-tests

# Run extension tests
npm test
```

### Running in Development

1. Open the project in VSCode
2. Press `F5` to launch Extension Development Host
3. Test features in the new VSCode window
4. Use `Ctrl+R` to reload after changes

### Project Architecture

```
vscode-jira-integration/
├── src/
│   ├── extension.ts              # Main extension entry point
│   ├── auth/
│   │   └── jiraAuthProvider.ts   # Authentication & credential management
│   ├── api/
│   │   └── jiraApiClient.ts      # Jira REST API client with retry logic
│   ├── providers/
│   │   └── jiraIssueProvider.ts  # Tree view provider for sidebar
│   └── test/
│       ├── runTest.ts            # Test runner configuration
│       └── suite/
│           ├── index.ts          # Test suite setup
│           └── extension.test.ts # Comprehensive test suite
├── .vscode/
│   ├── launch.json               # Debug configuration
│   ├── settings.json             # Workspace settings
│   └── tasks.json                # Build tasks
├── webpack.config.js             # Webpack bundling configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Extension manifest and dependencies
└── README.md                     # This file
```

### Key Components

#### JiraAuthProvider
- Secure credential storage using VSCode Secrets API
- Automatic credential validation and refresh
- Error handling for authentication failures

#### JiraApiClient
- Full Jira REST API v3 integration
- Automatic retry logic with exponential backoff
- Comprehensive error handling and user feedback
- Support for all major operations (CRUD, search, transitions)

#### JiraIssueProvider
- Tree view implementation for sidebar
- Categorized issue display with smart filtering
- Rich UI with icons, tooltips, and context menus
- Real-time updates and refresh capabilities

## 🔒 Security & Privacy

### Credential Storage
- **Secure Storage**: Uses VSCode's built-in Secrets API
- **Encryption**: Credentials encrypted at rest
- **No Logging**: API tokens never logged or exposed
- **Local Only**: No data sent to third parties

### API Token Security
- **Scoped Access**: Tokens have limited permissions
- **Validation**: Automatic token validation on startup
- **Expiration Handling**: Graceful handling of expired tokens
- **Easy Rotation**: Simple credential update process

### Network Security
- **HTTPS Only**: All API calls use secure connections
- **Timeout Protection**: Request timeouts prevent hanging
- **Rate Limiting**: Respectful API usage patterns

## 🐛 Troubleshooting

### Common Issues

#### Authentication Problems
**Issue**: "Invalid email or API token"
- **Solution**: Verify your email and regenerate API token
- **Check**: Ensure base URL is correct (include `https://`)

#### Connection Issues
**Issue**: "Cannot connect to Jira"
- **Solution**: Check internet connection and firewall settings
- **Verify**: Test base URL in browser

#### Permission Errors
**Issue**: "Access denied" or "Forbidden"
- **Solution**: Check Jira permissions for your account
- **Contact**: Your Jira administrator for access rights

#### Performance Issues
**Issue**: Slow loading or timeouts
- **Solution**: Reduce `maxResults` in settings
- **Check**: Network connection stability

### Debug Mode

Enable debug logging:
1. Open VSCode settings
2. Search for "jira debug"
3. Enable debug mode
4. Check Output panel → "Jira Integration"

### Getting Help

1. **Check Issues**: [GitHub Issues](https://github.com/your-repo/vscode-jira-integration/issues)
2. **Documentation**: This README and inline help
3. **Community**: VSCode Extension discussions
4. **Support**: Create detailed issue reports

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Contribution Steps
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Maintain test coverage above 80%
- Use conventional commit messages
- Update documentation for new features

## 📋 Roadmap

### Upcoming Features
- [ ] Offline mode with local caching
- [ ] Custom JQL query builder UI
- [ ] Bulk operations for multiple issues
- [ ] Integration with Git commits
- [ ] Custom field support
- [ ] Agile board integration
- [ ] Time tracking features
- [ ] Advanced reporting

### Version History

#### v0.0.1 (Current)
- Initial release
- Core Jira integration
- Issue management
- Authentication system
- Comprehensive test suite

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Atlassian**: For the comprehensive Jira REST API
- **VSCode Team**: For the excellent extension framework
- **Community**: For feedback and contributions

---

**Made with ❤️ for developers who love efficient workflows**

For more information, visit our [GitHub repository](https://github.com/your-repo/vscode-jira-integration).