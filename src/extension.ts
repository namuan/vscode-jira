import * as vscode from 'vscode';
import { JiraAuthProvider } from './auth/jiraAuthProvider';
import { JiraIssueProvider } from './providers/jiraIssueProvider';
import { JiraApiClient } from './api/jiraApiClient';
import { initializeLogger, logInfo } from './utils/logger';

let jiraAuthProvider: JiraAuthProvider;
let jiraApiClient: JiraApiClient;
let jiraIssueProvider: JiraIssueProvider;
let jiraOutputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
	// Setup logging
	jiraOutputChannel = vscode.window.createOutputChannel('Jira Integration');
	initializeLogger(jiraOutputChannel);
	logInfo('VSCode JIRA Integration extension is now active!');

	// Initialize providers
	jiraAuthProvider = new JiraAuthProvider(context);
	jiraApiClient = new JiraApiClient();
	jiraIssueProvider = new JiraIssueProvider(jiraApiClient);

	// Register commands
	const authenticateCommand = vscode.commands.registerCommand('jira.authenticate', async () => {
		try {
			await jiraAuthProvider.authenticate();
			// Set context for conditional UI elements
			vscode.commands.executeCommand('setContext', 'jira:authenticated', true);
			// Refresh the issue provider
			jiraIssueProvider.refresh();
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to authenticate with Jira: ${error}`);
		}
	});

	const clearCredentialsCommand = vscode.commands.registerCommand('jira.clearCredentials', async () => {
		try {
			await jiraAuthProvider.clearCredentials();
			vscode.window.showInformationMessage('Jira credentials cleared successfully.');
			// Refresh the issue provider
			jiraIssueProvider.refresh();
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to clear credentials: ${error}`);
		}
	});

	const viewIssuesCommand = vscode.commands.registerCommand('jira.viewIssues', async () => {
		try {
			const credentials = await jiraAuthProvider.getCredentials();
			if (!credentials) {
				vscode.window.showWarningMessage('Please authenticate with Jira first.');
				return;
			}

			jiraApiClient.setCredentials(credentials);
			const issues = await jiraApiClient.getIssues();

			// Enhanced issue items with more information
			const issueItems = issues.map(issue => {
				const priority = issue.fields.priority?.name || 'None';
				const assignee = issue.fields.assignee?.displayName || 'Unassigned';
				const project = issue.fields.project.name;

				return {
					label: `$(${getIssueTypeIcon(issue.fields.issuetype.name)}) ${issue.key}: ${issue.fields.summary}`,
					description: `${issue.fields.status.name} • ${priority} • ${assignee}`,
					detail: `Project: ${project} | ${issue.fields.description ? issue.fields.description.substring(0, 100) + '...' : 'No description'}`,
					issue: issue
				};
			});

			const selected = await vscode.window.showQuickPick(issueItems, {
				placeHolder: 'Select a Jira issue to view details',
				matchOnDescription: true,
				matchOnDetail: true,
				canPickMany: false
			});

			if (selected && selected.issue) {
				// Open the selected issue in webview
				vscode.commands.executeCommand('jira.openIssue', selected.issue);
			}
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to fetch Jira issues: ${error}`);
		}
	});

	const statusCommand = vscode.commands.registerCommand('jira.status', async () => {
		try {
			const status = await jiraAuthProvider.getAuthenticationStatus();
			if (status.authenticated) {
				vscode.window.showInformationMessage(
					`✅ Connected to Jira\nUser: ${status.user}\nInstance: ${status.baseUrl}`
				);
			} else {
				vscode.window.showWarningMessage('❌ Not connected to Jira. Please authenticate first.');
			}
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to check Jira status: ${error}`);
		}
	});

	const refreshCommand = vscode.commands.registerCommand('jira.refresh', async () => {
		try {
			jiraIssueProvider.refresh();
			vscode.window.showInformationMessage('Jira issues refreshed.');
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to refresh: ${error}`);
		}
	});

	const openIssueCommand = vscode.commands.registerCommand('jira.openIssue', async (issue) => {
		try {
			if (!issue) {
				vscode.window.showErrorMessage('No issue provided');
				return;
			}

			// Fetch detailed issue information including comments
			const credentials = await jiraAuthProvider.getCredentials();
			if (!credentials) {
				vscode.window.showWarningMessage('Please authenticate with Jira first.');
				return;
			}

			jiraApiClient.setCredentials(credentials);
			const detailedIssue = await jiraApiClient.getIssue(issue.key);

			// Create a webview to display issue details
			const panel = vscode.window.createWebviewPanel(
				'jiraIssue',
				`${detailedIssue.key}: ${detailedIssue.fields.summary}`,
				vscode.ViewColumn.One,
				{
					enableScripts: true,
					retainContextWhenHidden: true
				}
			);

			// Set the webview content with detailed information
			panel.webview.html = getIssueWebviewContent(detailedIssue, credentials.baseUrl);

			// Handle messages from the webview
			panel.webview.onDidReceiveMessage(
				async (message) => {
					switch (message.command) {
						case 'openInBrowser':
							const url = `${credentials.baseUrl}/browse/${detailedIssue.key}`;
							vscode.env.openExternal(vscode.Uri.parse(url));
							break;
						case 'addComment':
							const comment = await vscode.window.showInputBox({
								prompt: 'Enter your comment',
								placeHolder: 'Add a comment to this issue...'
							});
							if (comment) {
								try {
									await jiraApiClient.addComment(detailedIssue.key, comment);
									vscode.window.showInformationMessage('Comment added successfully!');
									// Refresh the webview content
									const updatedIssue = await jiraApiClient.getIssue(detailedIssue.key);
									panel.webview.html = getIssueWebviewContent(updatedIssue, credentials.baseUrl);
								} catch (error) {
									vscode.window.showErrorMessage(`Failed to add comment: ${error}`);
								}
							}
							break;
						case 'changeStatus':
							try {
								// Get available transitions
								const transitions = await jiraApiClient.getIssueTransitions(detailedIssue.key);
								if (transitions.length === 0) {
									vscode.window.showInformationMessage('No status transitions available for this issue.');
									return;
								}

								// Show transition options
								const transitionItems = transitions.map(t => ({
									label: t.name,
									id: t.id
								}));

								const selectedTransition = await vscode.window.showQuickPick(transitionItems, {
									placeHolder: 'Select new status'
								});

								if (selectedTransition) {
									await jiraApiClient.updateIssueStatus(detailedIssue.key, selectedTransition.id);
									vscode.window.showInformationMessage(`Issue status updated to: ${selectedTransition.label}`);
									// Refresh the webview content
									const updatedIssue = await jiraApiClient.getIssue(detailedIssue.key);
									panel.webview.html = getIssueWebviewContent(updatedIssue, credentials.baseUrl);
									// Refresh the sidebar
									jiraIssueProvider.refresh();
								}
							} catch (error) {
								vscode.window.showErrorMessage(`Failed to change status: ${error}`);
							}
							break;
						case 'refresh':
							try {
								const refreshedIssue = await jiraApiClient.getIssue(detailedIssue.key);
								panel.webview.html = getIssueWebviewContent(refreshedIssue, credentials.baseUrl);
								vscode.window.showInformationMessage('Issue details refreshed.');
							} catch (error) {
								vscode.window.showErrorMessage(`Failed to refresh issue: ${error}`);
							}
							break;
					}
				},
				undefined,
				context.subscriptions
			);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to open issue: ${error}`);
		}
	});

	const searchIssuesCommand = vscode.commands.registerCommand('jira.searchIssues', async () => {
		try {
			const credentials = await jiraAuthProvider.getCredentials();
			if (!credentials) {
				vscode.window.showWarningMessage('Please authenticate with Jira first.');
				return;
			}

			// Get search query from user
			const searchQuery = await vscode.window.showInputBox({
				prompt: 'Enter JQL query or search terms',
				placeHolder: 'e.g., "text ~ \"bug\"" or "project = PROJ AND status = Open"',
				value: ''
			});

			if (!searchQuery) {
				return;
			}

			// Convert simple text to JQL if needed
			let jql = searchQuery;
			if (!searchQuery.includes('=') && !searchQuery.includes('~')) {
				// Simple text search - convert to JQL
				jql = `text ~ "${searchQuery}" OR summary ~ "${searchQuery}" OR description ~ "${searchQuery}"`;
			}

			jiraApiClient.setCredentials(credentials);
			const issues = await jiraApiClient.getIssues(jql, 100);

			if (issues.length === 0) {
				vscode.window.showInformationMessage('No issues found matching your search.');
				return;
			}

			// Show search results
			const issueItems = issues.map(issue => {
				const priority = issue.fields.priority?.name || 'None';
				const assignee = issue.fields.assignee?.displayName || 'Unassigned';
				const project = issue.fields.project.name;

				return {
					label: `$(${getIssueTypeIcon(issue.fields.issuetype.name)}) ${issue.key}: ${issue.fields.summary}`,
					description: `${issue.fields.status.name} • ${priority} • ${assignee}`,
					detail: `Project: ${project} | ${issue.fields.description ? issue.fields.description.substring(0, 100) + '...' : 'No description'}`,
					issue: issue
				};
			});

			const selected = await vscode.window.showQuickPick(issueItems, {
				placeHolder: `Found ${issues.length} issues. Select one to view details.`,
				matchOnDescription: true,
				matchOnDetail: true,
				canPickMany: false
			});

			if (selected && selected.issue) {
				vscode.commands.executeCommand('jira.openIssue', selected.issue);
			}
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to search issues: ${error}`);
		}
	});

	const filterIssuesCommand = vscode.commands.registerCommand('jira.filterIssues', async () => {
		try {
			const credentials = await jiraAuthProvider.getCredentials();
			if (!credentials) {
				vscode.window.showWarningMessage('Please authenticate with Jira first.');
				return;
			}

			// Show filter options
			const filterOptions = [
				{ label: '$(person) My Issues', description: 'Issues assigned to me', jql: 'assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC' },
				{ label: '$(eye) My Watched Issues', description: 'Issues I am watching', jql: 'watcher = currentUser() AND resolution = Unresolved ORDER BY updated DESC' },
				{ label: '$(git-commit) My Reported Issues', description: 'Issues I reported', jql: 'reporter = currentUser() ORDER BY created DESC' },
				{ label: '$(play) In Progress', description: 'All in progress issues', jql: 'status in ("In Progress", "Development") ORDER BY updated DESC' },
				{ label: '$(circle-outline) Open Issues', description: 'All open issues', jql: 'status in ("Open", "To Do", "Backlog") ORDER BY priority DESC, updated DESC' },
				{ label: '$(bug) Bugs', description: 'All bug issues', jql: 'issuetype = Bug AND resolution = Unresolved ORDER BY priority DESC, updated DESC' },
				{ label: '$(arrow-up) High Priority', description: 'High priority issues', jql: 'priority in (Highest, High) AND resolution = Unresolved ORDER BY priority DESC, updated DESC' },
				{ label: '$(calendar) Recently Updated', description: 'Issues updated in last 7 days', jql: 'updated >= -7d ORDER BY updated DESC' }
			];

			const selectedFilter = await vscode.window.showQuickPick(filterOptions, {
				placeHolder: 'Select a filter to apply'
			});

			if (!selectedFilter) {
				return;
			}

			jiraApiClient.setCredentials(credentials);
			const issues = await jiraApiClient.getIssues(selectedFilter.jql, 100);

			if (issues.length === 0) {
				vscode.window.showInformationMessage(`No issues found for filter: ${selectedFilter.label}`);
				return;
			}

			// Show filtered results
			const issueItems = issues.map(issue => {
				const priority = issue.fields.priority?.name || 'None';
				const assignee = issue.fields.assignee?.displayName || 'Unassigned';
				const project = issue.fields.project.name;

				return {
					label: `$(${getIssueTypeIcon(issue.fields.issuetype.name)}) ${issue.key}: ${issue.fields.summary}`,
					description: `${issue.fields.status.name} • ${priority} • ${assignee}`,
					detail: `Project: ${project} | ${issue.fields.description ? issue.fields.description.substring(0, 100) + '...' : 'No description'}`,
					issue: issue
				};
			});

			const selected = await vscode.window.showQuickPick(issueItems, {
				placeHolder: `${selectedFilter.label}: Found ${issues.length} issues. Select one to view details.`,
				matchOnDescription: true,
				matchOnDetail: true,
				canPickMany: false
			});

			if (selected && selected.issue) {
				vscode.commands.executeCommand('jira.openIssue', selected.issue);
			}
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to filter issues: ${error}`);
		}
	});

	const updateIssueStatusCommand = vscode.commands.registerCommand('jira.updateIssueStatus', async () => {
		try {
			const credentials = await jiraAuthProvider.getCredentials();
			if (!credentials) {
				vscode.window.showWarningMessage('Please authenticate with Jira first.');
				return;
			}

			jiraApiClient.setCredentials(credentials);

			// Step 1: Get issue key
			const issueKey = await vscode.window.showInputBox({
				prompt: 'Enter issue key (e.g., PROJ-123)',
				placeHolder: 'PROJ-123',
				validateInput: (value) => {
					if (!value || !value.match(/^[A-Z]+-\d+$/)) {
						return 'Please enter a valid issue key (e.g., PROJ-123)';
					}
					return null;
				}
			});

			if (!issueKey) {
				return;
			}

			// Step 2: Get available transitions
			const transitions = await jiraApiClient.getIssueTransitions(issueKey);
			if (transitions.length === 0) {
				vscode.window.showInformationMessage('No status transitions available for this issue.');
				return;
			}

			// Step 3: Show transition options
			const transitionItems = transitions.map(t => ({
				label: `🔄 ${t.name}`,
				description: `Change status to ${t.name}`,
				id: t.id
			}));

			const selectedTransition = await vscode.window.showQuickPick(transitionItems, {
				placeHolder: `Select new status for ${issueKey}`
			});

			if (!selectedTransition) {
				return;
			}

			// Step 4: Confirm and update
			const confirm = await vscode.window.showInformationMessage(
				`Update ${issueKey} status to "${selectedTransition.label.replace('🔄 ', '')}"?`,
				{ modal: true },
				'Update Status',
				'Cancel'
			);

			if (confirm === 'Update Status') {
				await jiraApiClient.updateIssueStatus(issueKey, selectedTransition.id);
				vscode.window.showInformationMessage(`✅ Updated ${issueKey} status to: ${selectedTransition.label.replace('🔄 ', '')}`);
				// Refresh the sidebar
				jiraIssueProvider.refresh();
			}
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to update issue status: ${error}`);
		}
	});

	const addCommentCommand = vscode.commands.registerCommand('jira.addComment', async () => {
		try {
			const credentials = await jiraAuthProvider.getCredentials();
			if (!credentials) {
				vscode.window.showWarningMessage('Please authenticate with Jira first.');
				return;
			}

			jiraApiClient.setCredentials(credentials);

			// Step 1: Get issue key
			const issueKey = await vscode.window.showInputBox({
				prompt: 'Enter issue key (e.g., PROJ-123)',
				placeHolder: 'PROJ-123',
				validateInput: (value) => {
					if (!value || !value.match(/^[A-Z]+-\d+$/)) {
						return 'Please enter a valid issue key (e.g., PROJ-123)';
					}
					return null;
				}
			});

			if (!issueKey) {
				return;
			}

			// Step 2: Get comment text
			const comment = await vscode.window.showInputBox({
				prompt: `Enter comment for ${issueKey}`,
				placeHolder: 'Add your comment here...',
				validateInput: (value) => {
					if (!value || value.trim().length < 1) {
						return 'Comment cannot be empty';
					}
					return null;
				}
			});

			if (!comment) {
				return;
			}

			// Step 3: Add comment with progress
			vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: `Adding comment to ${issueKey}...`,
				cancellable: false
			}, async (progress) => {
				try {
					progress.report({ increment: 50, message: 'Posting comment...' });
					await jiraApiClient.addComment(issueKey, comment.trim());
					progress.report({ increment: 50, message: 'Comment added successfully!' });
					vscode.window.showInformationMessage(`✅ Comment added to ${issueKey}`);
				} catch (error) {
					vscode.window.showErrorMessage(`Failed to add comment: ${error}`);
				}
			});
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to add comment: ${error}`);
		}
	});

	const assignIssueCommand = vscode.commands.registerCommand('jira.assignIssue', async () => {
		try {
			const credentials = await jiraAuthProvider.getCredentials();
			if (!credentials) {
				vscode.window.showWarningMessage('Please authenticate with Jira first.');
				return;
			}

			jiraApiClient.setCredentials(credentials);

			// Step 1: Get issue key
			const issueKey = await vscode.window.showInputBox({
				prompt: 'Enter issue key (e.g., PROJ-123)',
				placeHolder: 'PROJ-123',
				validateInput: (value) => {
					if (!value || !value.match(/^[A-Z]+-\d+$/)) {
						return 'Please enter a valid issue key (e.g., PROJ-123)';
					}
					return null;
				}
			});

			if (!issueKey) {
				return;
			}

			// Step 2: Choose assignment option
			const assignmentOptions = [
				{ label: '👤 Assign to Me', description: 'Assign this issue to yourself', value: 'self' },
				{ label: '👥 Assign to Someone Else', description: 'Enter email or username', value: 'other' },
				{ label: '❌ Unassign', description: 'Remove current assignee', value: 'unassign' }
			];

			const selectedOption = await vscode.window.showQuickPick(assignmentOptions, {
				placeHolder: `Select assignment option for ${issueKey}`
			});

			if (!selectedOption) {
				return;
			}

			let assigneeId: string | null = null;
			let assigneeName = 'Unassigned';

			if (selectedOption.value === 'self') {
				// Get current user info
				try {
					const response = await jiraApiClient.getCurrentUser();
					assigneeId = response.accountId;
					assigneeName = response.displayName;
				} catch (error) {
					vscode.window.showErrorMessage('Failed to get current user information.');
					return;
				}
			} else if (selectedOption.value === 'other') {
				// Get assignee email/username
				const assigneeInput = await vscode.window.showInputBox({
					prompt: 'Enter assignee email or username',
					placeHolder: 'user@example.com or username',
					validateInput: (value) => {
						if (!value || value.trim().length < 3) {
							return 'Please enter a valid email or username';
						}
						return null;
					}
				});

				if (!assigneeInput) {
					return;
				}

				// For simplicity, we'll use the input as the assignee ID
				// In a real implementation, you might want to search for users
				assigneeId = assigneeInput.trim();
				assigneeName = assigneeInput.trim();
			}
			// For unassign, assigneeId remains null

			// Step 3: Confirm assignment
			const confirmMessage = selectedOption.value === 'unassign'
				? `Unassign ${issueKey}?`
				: `Assign ${issueKey} to ${assigneeName}?`;

			const confirm = await vscode.window.showInformationMessage(
				confirmMessage,
				{ modal: true },
				'Assign',
				'Cancel'
			);

			if (confirm === 'Assign') {
				await jiraApiClient.assignIssue(issueKey, assigneeId);
				const message = selectedOption.value === 'unassign'
					? `✅ Unassigned ${issueKey}`
					: `✅ Assigned ${issueKey} to ${assigneeName}`;
				vscode.window.showInformationMessage(message);
				// Refresh the sidebar
				jiraIssueProvider.refresh();
			}
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to assign issue: ${error}`);
		}
	});

	const quickActionsCommand = vscode.commands.registerCommand('jira.quickActions', async () => {
		try {
			const credentials = await jiraAuthProvider.getCredentials();
			if (!credentials) {
				vscode.window.showWarningMessage('Please authenticate with Jira first.');
				return;
			}

			// Show quick action options
			const actions = [
				{ label: '🔄 Update Issue Status', description: 'Change the status of an issue', command: 'jira.updateIssueStatus' },
				{ label: '👤 Assign Issue', description: 'Assign an issue to someone', command: 'jira.assignIssue' },
				{ label: '💬 Add Comment', description: 'Add a comment to an issue', command: 'jira.addComment' },
				{ label: '➕ Create Issue', description: 'Create a new Jira issue', command: 'jira.createIssue' },
				{ label: '🔍 Search Issues', description: 'Search for issues using JQL', command: 'jira.searchIssues' },
				{ label: '🗂️ Filter Issues', description: 'Apply predefined filters', command: 'jira.filterIssues' },
				{ label: '📋 View My Issues', description: 'View issues assigned to me', command: 'jira.viewIssues' },
				{ label: '🔗 Check Connection', description: 'Check Jira connection status', command: 'jira.status' },
				{ label: '🔄 Refresh', description: 'Refresh issue list', command: 'jira.refresh' }
			];

			const selectedAction = await vscode.window.showQuickPick(actions, {
				placeHolder: 'Select a Jira action'
			});

			if (selectedAction) {
				vscode.commands.executeCommand(selectedAction.command);
			}
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to show quick actions: ${error}`);
		}
	});

	const createIssueCommand = vscode.commands.registerCommand('jira.createIssue', async () => {
		try {
			const credentials = await jiraAuthProvider.getCredentials();
			if (!credentials) {
				vscode.window.showWarningMessage('Please authenticate with Jira first.');
				return;
			}

			jiraApiClient.setCredentials(credentials);

			// Step 1: Select project
			const projects = await jiraApiClient.getProjects();
			if (projects.length === 0) {
				vscode.window.showErrorMessage('No accessible projects found.');
				return;
			}

			const projectItems = projects.map(project => ({
				label: `${project.name} (${project.key})`,
				description: project.key,
				project: project
			}));

			const selectedProject = await vscode.window.showQuickPick(projectItems, {
				placeHolder: 'Select a project for the new issue'
			});

			if (!selectedProject) {
				return;
			}

			// Step 2: Select issue type
			const issueTypes = [
				{ label: '🐛 Bug', description: 'Something isn\'t working', value: 'Bug' },
				{ label: '✨ Feature', description: 'New feature or enhancement', value: 'Story' },
				{ label: '📋 Task', description: 'General task or work item', value: 'Task' },
				{ label: '🚀 Epic', description: 'Large feature or initiative', value: 'Epic' },
				{ label: '🔧 Improvement', description: 'Enhancement to existing functionality', value: 'Improvement' },
				{ label: '📖 Documentation', description: 'Documentation related work', value: 'Task' }
			];

			const selectedIssueType = await vscode.window.showQuickPick(issueTypes, {
				placeHolder: 'Select issue type'
			});

			if (!selectedIssueType) {
				return;
			}

			// Step 3: Get issue summary
			const summary = await vscode.window.showInputBox({
				prompt: 'Enter issue summary',
				placeHolder: 'Brief, descriptive title for the issue',
				validateInput: (value) => {
					if (!value || value.trim().length < 5) {
						return 'Summary must be at least 5 characters long';
					}
					if (value.length > 255) {
						return 'Summary must be less than 255 characters';
					}
					return null;
				}
			});

			if (!summary) {
				return;
			}

			// Step 4: Get issue description
			const description = await vscode.window.showInputBox({
				prompt: 'Enter issue description (optional)',
				placeHolder: 'Detailed description, steps to reproduce, acceptance criteria, etc.'
			});

			// Step 5: Get priority (optional)
			const priorities = [
				{ label: '🔴 Highest', description: 'Critical issue requiring immediate attention', value: 'Highest' },
				{ label: '🟠 High', description: 'Important issue that should be addressed soon', value: 'High' },
				{ label: '🟡 Medium', description: 'Standard priority', value: 'Medium' },
				{ label: '🟢 Low', description: 'Nice to have, can be addressed later', value: 'Low' },
				{ label: '⚪ Lowest', description: 'Minimal priority', value: 'Lowest' }
			];

			const selectedPriority = await vscode.window.showQuickPick(priorities, {
				placeHolder: 'Select priority (optional, press Escape to skip)'
			});

			// Step 6: Confirm creation
			const confirmMessage = `Create ${selectedIssueType.label} in ${selectedProject.project.name}?\n\nSummary: ${summary}\nDescription: ${description || 'None'}\nPriority: ${selectedPriority?.label || 'Default'}`;

			const confirm = await vscode.window.showInformationMessage(
				confirmMessage,
				{ modal: true },
				'Create Issue',
				'Cancel'
			);

			if (confirm !== 'Create Issue') {
				return;
			}

			// Create the issue
			vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: 'Creating Jira issue...',
				cancellable: false
			}, async (progress) => {
				try {
					progress.report({ increment: 30, message: 'Preparing issue data...' });

					const newIssue = await jiraApiClient.createIssue({
						summary: summary.trim(),
						description: description?.trim() || '',
						issueType: selectedIssueType.value,
						projectKey: selectedProject.project.key,
						priority: selectedPriority?.value
					});

					progress.report({ increment: 70, message: 'Issue created successfully!' });

					// Show success message with options
					const action = await vscode.window.showInformationMessage(
						`✅ Created issue: ${newIssue.key}`,
						'Open Issue',
						'Open in Browser',
						'Refresh Issues'
					);

					switch (action) {
						case 'Open Issue':
							vscode.commands.executeCommand('jira.openIssue', newIssue);
							break;
						case 'Open in Browser':
							const url = `${credentials.baseUrl}/browse/${newIssue.key}`;
							vscode.env.openExternal(vscode.Uri.parse(url));
							break;
						case 'Refresh Issues':
							jiraIssueProvider.refresh();
							break;
					}
				} catch (error) {
					vscode.window.showErrorMessage(`Failed to create Jira issue: ${error}`);
				}
			});
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to create Jira issue: ${error}`);
		}
	});

	// Register tree data provider for Jira issues
	vscode.window.registerTreeDataProvider('jiraIssues', jiraIssueProvider);

	// Add commands to context
	context.subscriptions.push(
		authenticateCommand,
		clearCredentialsCommand,
		statusCommand,
		refreshCommand,
		openIssueCommand,
		viewIssuesCommand,
		searchIssuesCommand,
		filterIssuesCommand,
		updateIssueStatusCommand,
		addCommentCommand,
		assignIssueCommand,
		quickActionsCommand,
		createIssueCommand
	);

	// Check if already authenticated on startup
	jiraAuthProvider.isAuthenticated().then(isAuth => {
		if (isAuth) {
			vscode.commands.executeCommand('setContext', 'jira:authenticated', true);
			jiraAuthProvider.getCredentials().then(credentials => {
				if (credentials) {
					jiraApiClient.setCredentials(credentials);
				}
			});
		}
	});
}

export function deactivate() {
	logInfo('VSCode JIRA Integration extension is now deactivated.');
	if (jiraOutputChannel) {
		jiraOutputChannel.dispose();
	}
}

function getIssueTypeIcon(issueType: string): string {
	switch (issueType.toLowerCase()) {
		case 'bug':
			return 'bug';
		case 'task':
			return 'checklist';
		case 'story':
		case 'user story':
			return 'book';
		case 'epic':
			return 'project';
		case 'subtask':
		case 'sub-task':
			return 'list-tree';
		default:
			return 'circle-outline';
	}
}

function getIssueWebviewContent(issue: any, baseUrl?: string): string {
	const createdDate = new Date(issue.fields.created).toLocaleDateString();
	const updatedDate = new Date(issue.fields.updated).toLocaleDateString();

	// Process comments if available
	let commentsHtml = '';
	if (issue.fields.comment && issue.fields.comment.comments) {
		const comments = issue.fields.comment.comments.slice(-5); // Show last 5 comments
		commentsHtml = comments.map((comment: any) => {
			const commentDate = new Date(comment.created).toLocaleDateString();
			const author = comment.author.displayName;
			const body = comment.body.content ?
				comment.body.content.map((c: any) =>
					c.content ? c.content.map((t: any) => t.text).join('') : ''
				).join('\n') : 'No content';

			return `
				<div class="comment">
					<div class="comment-header">
						<strong>${author}</strong>
						<span class="comment-date">${commentDate}</span>
					</div>
					<div class="comment-body">${body}</div>
				</div>
			`;
		}).join('');
	}

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${issue.key}</title>
	<style>
		body {
			font-family: var(--vscode-font-family);
			padding: 20px;
			color: var(--vscode-foreground);
			background-color: var(--vscode-editor-background);
			line-height: 1.5;
		}
		.header {
			border-bottom: 1px solid var(--vscode-panel-border);
			padding-bottom: 15px;
			margin-bottom: 20px;
			display: flex;
			justify-content: space-between;
			align-items: flex-start;
		}
		.header-content {
			flex: 1;
		}
		.header-actions {
			display: flex;
			gap: 10px;
		}
		.issue-key {
			font-size: 14px;
			color: var(--vscode-descriptionForeground);
			margin-bottom: 5px;
		}
		.issue-title {
			font-size: 24px;
			font-weight: bold;
			margin: 0;
		}
		.status-badge {
			display: inline-block;
			padding: 4px 8px;
			border-radius: 12px;
			font-size: 12px;
			font-weight: bold;
			background-color: var(--vscode-badge-background);
			color: var(--vscode-badge-foreground);
			margin-top: 8px;
		}
		.metadata {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
			gap: 15px;
			margin-bottom: 20px;
		}
		.metadata-item {
			padding: 12px;
			background-color: var(--vscode-editor-inactiveSelectionBackground);
			border-radius: 6px;
			border: 1px solid var(--vscode-panel-border);
		}
		.metadata-label {
			font-weight: bold;
			color: var(--vscode-descriptionForeground);
			font-size: 11px;
			text-transform: uppercase;
			margin-bottom: 6px;
			letter-spacing: 0.5px;
		}
		.metadata-value {
			font-size: 14px;
			word-wrap: break-word;
		}
		.section {
			margin: 25px 0;
			padding: 15px;
			background-color: var(--vscode-textBlockQuote-background);
			border-left: 4px solid var(--vscode-textBlockQuote-border);
			border-radius: 4px;
		}
		.section-title {
			font-weight: bold;
			color: var(--vscode-descriptionForeground);
			font-size: 14px;
			text-transform: uppercase;
			margin-bottom: 12px;
			letter-spacing: 0.5px;
		}
		.comments {
			max-height: 400px;
			overflow-y: auto;
		}
		.comment {
			margin-bottom: 15px;
			padding: 12px;
			background-color: var(--vscode-editor-background);
			border-radius: 4px;
			border: 1px solid var(--vscode-panel-border);
		}
		.comment-header {
			display: flex;
			justify-content: space-between;
			margin-bottom: 8px;
			font-size: 13px;
		}
		.comment-date {
			color: var(--vscode-descriptionForeground);
		}
		.comment-body {
			font-size: 14px;
			white-space: pre-wrap;
		}
		.actions {
			margin-top: 25px;
			display: flex;
			gap: 10px;
			flex-wrap: wrap;
		}
		.btn {
			padding: 10px 16px;
			background-color: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			border: none;
			border-radius: 4px;
			cursor: pointer;
			font-size: 13px;
			font-weight: 500;
			transition: background-color 0.2s;
		}
		.btn:hover {
			background-color: var(--vscode-button-hoverBackground);
		}
		.btn-secondary {
			background-color: var(--vscode-button-secondaryBackground);
			color: var(--vscode-button-secondaryForeground);
		}
		.btn-secondary:hover {
			background-color: var(--vscode-button-secondaryHoverBackground);
		}
		.btn-small {
			padding: 6px 12px;
			font-size: 12px;
		}
		.no-comments {
			color: var(--vscode-descriptionForeground);
			font-style: italic;
			text-align: center;
			padding: 20px;
		}
	</style>
</head>
<body>
	<div class="header">
		<div class="header-content">
			<div class="issue-key">${issue.key}</div>
			<h1 class="issue-title">${issue.fields.summary}</h1>
			<div class="status-badge">${issue.fields.status.name}</div>
		</div>
		<div class="header-actions">
			<button class="btn btn-small btn-secondary" onclick="refresh()">🔄 Refresh</button>
		</div>
	</div>
	
	<div class="metadata">
		<div class="metadata-item">
			<div class="metadata-label">Type</div>
			<div class="metadata-value">${issue.fields.issuetype.name}</div>
		</div>
		<div class="metadata-item">
			<div class="metadata-label">Project</div>
			<div class="metadata-value">${issue.fields.project.name} (${issue.fields.project.key})</div>
		</div>
		<div class="metadata-item">
			<div class="metadata-label">Priority</div>
			<div class="metadata-value">${issue.fields.priority?.name || 'None'}</div>
		</div>
		<div class="metadata-item">
			<div class="metadata-label">Assignee</div>
			<div class="metadata-value">${issue.fields.assignee?.displayName || 'Unassigned'}</div>
		</div>
		<div class="metadata-item">
			<div class="metadata-label">Reporter</div>
			<div class="metadata-value">${issue.fields.reporter?.displayName || 'Unknown'}</div>
		</div>
		<div class="metadata-item">
			<div class="metadata-label">Created</div>
			<div class="metadata-value">${createdDate}</div>
		</div>
		<div class="metadata-item">
			<div class="metadata-label">Updated</div>
			<div class="metadata-value">${updatedDate}</div>
		</div>
		<div class="metadata-item">
			<div class="metadata-label">Resolution</div>
			<div class="metadata-value">${issue.fields.resolution?.name || 'Unresolved'}</div>
		</div>
	</div>
	
	<div class="section">
		<div class="section-title">Description</div>
		<div>${issue.fields.description || 'No description provided'}</div>
	</div>
	
	${commentsHtml ? `
	<div class="section">
		<div class="section-title">Recent Comments</div>
		<div class="comments">
			${commentsHtml}
		</div>
	</div>
	` : `
	<div class="section">
		<div class="section-title">Comments</div>
		<div class="no-comments">No comments yet</div>
	</div>
	`}
	
	<div class="actions">
		<button class="btn" onclick="openInBrowser()">🔗 Open in Jira</button>
		<button class="btn btn-secondary" onclick="changeStatus()">🔄 Change Status</button>
		<button class="btn btn-secondary" onclick="addComment()">💬 Add Comment</button>
	</div>
	
	<script>
		const vscode = acquireVsCodeApi();
		
		function openInBrowser() {
			vscode.postMessage({
				command: 'openInBrowser'
			});
		}
		
		function addComment() {
			vscode.postMessage({
				command: 'addComment'
			});
		}
		
		function changeStatus() {
			vscode.postMessage({
				command: 'changeStatus'
			});
		}
		
		function refresh() {
			vscode.postMessage({
				command: 'refresh'
			});
		}
	</script>
</body>
</html>`;
}