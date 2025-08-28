# Developer Testing Guide

This guide provides comprehensive instructions for developers to test the VSCode JIRA Integration extension during development and before release.

## 🚀 Quick Start Testing

### Prerequisites
1. **VSCode**: Version 1.74.0 or higher
2. **Node.js**: Version 16.x or higher
3. **Jira Cloud Instance**: Access to a Jira Cloud instance for testing
4. **API Token**: Generated from Atlassian Account Settings

### Setup Development Environment

```bash
# Clone and setup
git clone <repository-url>
cd vscode-jira-integration
npm install

# Build the extension
npm run compile

# Run tests
npm test
```

## 🧪 Testing Methods

### 1. Extension Development Host Testing

#### Launch Extension Host
1. Open the project in VSCode
2. Press `F5` or go to `Run and Debug` → `Run Extension`
3. A new VSCode window opens with the extension loaded
4. Test all functionality in this new window

#### Hot Reload During Development
1. Make code changes in the main window
2. Press `Ctrl+R` (Windows/Linux) or `Cmd+R` (Mac) in the Extension Host window
3. Extension reloads with your changes

### 2. Unit and Integration Testing

#### Run Test Suite
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --grep "JiraApiClient"

# Run tests in watch mode
npm run test:watch
```

#### Test Structure
- **Unit Tests**: Individual component testing with mocks
- **Integration Tests**: End-to-end workflow testing
- **API Tests**: Mocked Jira API response testing

### 3. Manual Testing Scenarios

## 📋 Comprehensive Test Checklist

### Authentication Testing

#### ✅ Initial Authentication
- [ ] Open Command Palette (`Ctrl+Shift+P`)
- [ ] Run `Jira: Authenticate with Jira`
- [ ] Enter invalid base URL → Should show error
- [ ] Enter valid base URL but invalid credentials → Should show error
- [ ] Enter valid credentials → Should show success message
- [ ] Verify Jira sidebar appears in Activity Bar

#### ✅ Credential Validation
- [ ] Run `Jira: Check Jira Connection Status`
- [ ] Should display user info and connection status
- [ ] Test with expired token → Should handle gracefully
- [ ] Test with revoked token → Should prompt re-authentication

#### ✅ Credential Management
- [ ] Run `Jira: Clear Jira Credentials`
- [ ] Verify credentials are cleared
- [ ] Verify sidebar shows "not authenticated" state
- [ ] Re-authenticate and verify persistence across VSCode restarts

### Issue Management Testing

#### ✅ Issue Viewing
- [ ] Open Jira sidebar panel
- [ ] Verify issues are categorized (In Progress, To Do, Review, Done)
- [ ] Click on category → Should expand to show issues
- [ ] Hover over issue → Should show detailed tooltip
- [ ] Click on issue → Should open detailed webview

#### ✅ Issue Details
- [ ] Open any issue from sidebar
- [ ] Verify all metadata is displayed correctly:
  - [ ] Issue key and summary
  - [ ] Status, type, project, priority
  - [ ] Assignee, reporter, dates
  - [ ] Description
  - [ ] Recent comments (if any)
- [ ] Test action buttons:
  - [ ] "Open in Jira" → Should open browser
  - [ ] "Change Status" → Should show available transitions
  - [ ] "Add Comment" → Should allow comment input
  - [ ] "Refresh" → Should update issue data

#### ✅ Issue Creation
- [ ] Run `Jira: Create Jira Issue`
- [ ] Test project selection:
  - [ ] Should show available projects
  - [ ] Select different projects
- [ ] Test issue type selection:
  - [ ] Should show Bug, Feature, Task, Epic, etc.
  - [ ] Verify icons and descriptions
- [ ] Test summary input:
  - [ ] Enter summary < 5 chars → Should show validation error
  - [ ] Enter summary > 255 chars → Should show validation error
  - [ ] Enter valid summary → Should accept
- [ ] Test description input (optional)
- [ ] Test priority selection (optional)
- [ ] Test confirmation dialog
- [ ] Verify issue creation and success actions

#### ✅ Status Updates
- [ ] Run `Jira: Update Issue Status`
- [ ] Enter invalid issue key → Should show validation error
- [ ] Enter valid issue key → Should show available transitions
- [ ] Select transition → Should update successfully
- [ ] Verify sidebar refreshes with new status

#### ✅ Comment Addition
- [ ] Run `Jira: Add Comment to Issue`
- [ ] Enter invalid issue key → Should show validation error
- [ ] Enter valid issue key
- [ ] Enter empty comment → Should show validation error
- [ ] Enter valid comment → Should add successfully
- [ ] Verify comment appears in issue detail view

#### ✅ Issue Assignment
- [ ] Run `Jira: Assign Issue`
- [ ] Enter invalid issue key → Should show validation error
- [ ] Enter valid issue key
- [ ] Test "Assign to Me" option
- [ ] Test "Assign to Someone Else" option
- [ ] Test "Unassign" option
- [ ] Verify assignment changes in sidebar and detail view

### Search and Filtering Testing

#### ✅ Basic Issue Viewing
- [ ] Run `Jira: View Jira Issues`
- [ ] Should show enhanced issue list with icons
- [ ] Test search within the quick pick
- [ ] Select issue → Should open detail view

#### ✅ Text Search
- [ ] Run `Jira: Search Issues`
- [ ] Enter simple text (e.g., "bug") → Should convert to JQL
- [ ] Enter JQL query → Should use as-is
- [ ] Test with no results → Should show appropriate message
- [ ] Test with many results → Should limit and show count

#### ✅ Predefined Filters
- [ ] Run `Jira: Filter Issues`
- [ ] Test each predefined filter:
  - [ ] My Issues
  - [ ] My Watched Issues
  - [ ] My Reported Issues
  - [ ] In Progress
  - [ ] Open Issues
  - [ ] Bugs
  - [ ] High Priority
  - [ ] Recently Updated
- [ ] Verify results match filter criteria

### Quick Actions Testing

#### ✅ Quick Actions Menu
- [ ] Run `Jira: Jira Quick Actions`
- [ ] Verify all actions are listed with proper icons
- [ ] Test each action from the menu
- [ ] Verify actions work same as individual commands

### Error Handling Testing

#### ✅ Network Errors
- [ ] Disconnect internet → Test any operation
- [ ] Should show network error message
- [ ] Reconnect → Should work normally

#### ✅ API Errors
- [ ] Use invalid/expired token
- [ ] Should show authentication error
- [ ] Should prompt for re-authentication

#### ✅ Permission Errors
- [ ] Try operations without proper Jira permissions
- [ ] Should show appropriate error messages
- [ ] Should not crash the extension

### Performance Testing

#### ✅ Large Dataset Handling
- [ ] Test with projects having 100+ issues
- [ ] Verify sidebar loads within reasonable time
- [ ] Test search with many results
- [ ] Verify no memory leaks during extended use

#### ✅ Concurrent Operations
- [ ] Perform multiple operations simultaneously
- [ ] Verify proper queuing and error handling
- [ ] Test refresh during other operations

## 🔧 Advanced Testing Scenarios

### Edge Cases

#### ✅ Special Characters
- [ ] Test issue creation with special characters in summary/description
- [ ] Test search with special characters
- [ ] Test comments with emojis and Unicode

#### ✅ Long Content
- [ ] Test with very long issue summaries
- [ ] Test with very long descriptions
- [ ] Test with many comments (50+)

#### ✅ Empty States
- [ ] Test with user having no assigned issues
- [ ] Test with projects having no issues
- [ ] Test with issues having no comments

### Cross-Platform Testing

#### ✅ Windows Testing
- [ ] Test all functionality on Windows
- [ ] Verify keyboard shortcuts work
- [ ] Test file paths and separators

#### ✅ macOS Testing
- [ ] Test all functionality on macOS
- [ ] Verify keyboard shortcuts work
- [ ] Test with different VSCode themes

#### ✅ Linux Testing
- [ ] Test all functionality on Linux
- [ ] Verify keyboard shortcuts work
- [ ] Test with different desktop environments

## 🐛 Bug Testing Scenarios

### Regression Testing

#### ✅ After Code Changes
- [ ] Run full test suite
- [ ] Test core workflows manually
- [ ] Verify no existing functionality is broken

#### ✅ After Dependency Updates
- [ ] Test authentication flow
- [ ] Test API communication
- [ ] Test UI rendering

### Stress Testing

#### ✅ High Load Scenarios
- [ ] Rapid successive API calls
- [ ] Multiple VSCode windows with extension
- [ ] Extended usage sessions (1+ hours)

## 📊 Test Data Setup

### Jira Test Environment

#### Required Test Data
1. **Projects**: At least 2 projects with different configurations
2. **Issue Types**: Bug, Task, Story, Epic
3. **Statuses**: To Do, In Progress, Review, Done
4. **Priorities**: Highest, High, Medium, Low, Lowest
5. **Users**: Multiple users for assignment testing
6. **Issues**: Various issues in different states

#### Test Issue Creation Script
```javascript
// Use this in browser console on Jira to create test issues
for (let i = 1; i <= 10; i++) {
  // Create issues via Jira UI or API
  console.log(`Creating test issue ${i}`);
}
```

### Mock Data for Unit Tests

The test suite includes comprehensive mock data:
- Mock issues with all field types
- Mock projects and users
- Mock API responses for all endpoints
- Error scenarios and edge cases

## 🚀 Automated Testing

### Continuous Integration

```yaml
# .github/workflows/test.yml
name: Test Extension
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm run compile
      - run: npm test
      - run: npm run lint
```

### Pre-commit Hooks

```bash
# Install husky for git hooks
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "npm test"
```

## 📝 Test Reporting

### Manual Test Report Template

```markdown
## Test Report - [Date]

### Environment
- VSCode Version: 
- Extension Version: 
- OS: 
- Node.js Version: 

### Test Results
- ✅ Authentication: PASS/FAIL
- ✅ Issue Management: PASS/FAIL
- ✅ Search & Filter: PASS/FAIL
- ✅ Error Handling: PASS/FAIL

### Issues Found
1. [Issue description]
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Severity: High/Medium/Low

### Performance Notes
- Load time: 
- Memory usage: 
- API response times: 

### Recommendations
- [Any suggestions for improvements]
```

## 🔍 Debugging Tips

### VSCode Developer Tools
1. Open Extension Host window
2. Press `Ctrl+Shift+I` to open Developer Tools
3. Check Console for errors and logs
4. Use Network tab to monitor API calls

### Extension Logs
1. Open Output panel in VSCode
2. Select "Jira Integration" from dropdown
3. Monitor logs during testing

### Breakpoint Debugging
1. Set breakpoints in source code
2. Press `F5` to start debugging
3. Step through code execution
4. Inspect variables and call stack

## ✅ Release Testing Checklist

Before releasing a new version:

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual testing completed on all platforms
- [ ] Performance testing completed
- [ ] Security testing completed
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Version number bumped
- [ ] Extension packaged successfully
- [ ] Installation testing completed

## 🤝 Contributing Test Cases

When adding new features:

1. **Write Tests First**: Follow TDD approach
2. **Add Manual Test Cases**: Update this document
3. **Test Edge Cases**: Consider error scenarios
4. **Update Documentation**: Keep guides current
5. **Verify Backwards Compatibility**: Test with existing data

---

**Happy Testing! 🎉**

For questions or issues with testing, please create an issue in the repository or contact the development team.