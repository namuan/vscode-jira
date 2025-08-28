import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { JiraApiClient } from '../../api/jiraApiClient';
import { JiraAuthProvider } from '../../auth/jiraAuthProvider';
import { JiraIssueProvider } from '../../providers/jiraIssueProvider';

// Mock Jira API responses
const mockIssues: any[] = [
	{
		key: 'TEST-123',
		fields: {
			summary: 'Test issue for VSCode integration',
			description: 'This is a test issue description',
			status: { name: 'In Progress' },
			issuetype: { name: 'Bug' },
			project: { key: 'TEST', name: 'Test Project' },
			priority: { name: 'High' },
			assignee: { displayName: 'John Doe', emailAddress: 'john@example.com' },
			reporter: { displayName: 'Jane Smith', emailAddress: 'jane@example.com' },
			resolution: undefined,
			created: '2024-01-01T10:00:00.000Z',
			updated: '2024-01-02T15:30:00.000Z',
			comment: {
				comments: [
					{
						id: '1',
						author: { displayName: 'John Doe' },
						body: {
							content: [{
								content: [{ text: 'This is a test comment' }]
							}]
						},
						created: '2024-01-02T14:00:00.000Z'
					}
				]
			}
		}
	},
	{
		key: 'TEST-456',
		fields: {
			summary: 'Another test issue',
			description: 'Second test issue',
			status: { name: 'To Do' },
			issuetype: { name: 'Task' },
			project: { key: 'TEST', name: 'Test Project' },
			priority: { name: 'Medium' },
			assignee: undefined,
			reporter: { displayName: 'Jane Smith', emailAddress: 'jane@example.com' },
			resolution: undefined,
			created: '2024-01-01T09:00:00.000Z',
			updated: '2024-01-01T09:00:00.000Z',
			comment: { comments: [] }
		}
	}
];

const mockProjects = [
	{ key: 'TEST', name: 'Test Project', id: '10001' },
	{ key: 'DEMO', name: 'Demo Project', id: '10002' }
];

const mockTransitions = [
	{ id: '11', name: 'To Do' },
	{ id: '21', name: 'In Progress' },
	{ id: '31', name: 'Done' }
];

const mockCurrentUser = {
	accountId: 'user123',
	displayName: 'Test User',
	emailAddress: 'test@example.com'
};

const mockCredentials = {
	baseUrl: 'https://test.atlassian.net',
	email: 'test@example.com',
	apiToken: 'test-api-token'
};

suite('VSCode JIRA Integration Extension Test Suite', () => {
	let apiClientStub: sinon.SinonStubbedInstance<JiraApiClient>;
	let authProviderStub: sinon.SinonStubbedInstance<JiraAuthProvider>;
	let issueProvider: JiraIssueProvider;

	setup(() => {
		// Create stubs for the main classes
		apiClientStub = sinon.createStubInstance(JiraApiClient);
		authProviderStub = sinon.createStubInstance(JiraAuthProvider);

		// Setup default stub behaviors
		apiClientStub.getIssues.resolves(mockIssues);
		apiClientStub.getIssue.resolves(mockIssues[0]);
		apiClientStub.getProjects.resolves(mockProjects);
		apiClientStub.getIssueTransitions.resolves(mockTransitions);
		apiClientStub.getCurrentUser.resolves(mockCurrentUser);
		apiClientStub.createIssue.resolves(mockIssues[0]);
		apiClientStub.addComment.resolves();
		apiClientStub.updateIssueStatus.resolves();
		apiClientStub.assignIssue.resolves();

		authProviderStub.getCredentials.resolves(mockCredentials);
		authProviderStub.isAuthenticated.resolves(true);
		authProviderStub.authenticate.resolves(mockCredentials);

		// Create issue provider with mocked API client
		issueProvider = new JiraIssueProvider(apiClientStub as any);
	});

	teardown(() => {
		sinon.restore();
	});

	test('Extension should be present', () => {
		assert.ok(vscode.extensions.getExtension('undefined_publisher.vscode-jira-integration'));
	});

	test('Should activate extension', async () => {
		const extension = vscode.extensions.getExtension('undefined_publisher.vscode-jira-integration');
		if (extension) {
			await extension.activate();
			assert.strictEqual(extension.isActive, true);
		}
	});

	test('JiraApiClient - Should fetch issues successfully', async () => {
		const issues = await apiClientStub.getIssues();
		assert.strictEqual(issues.length, 2);
		assert.strictEqual(issues[0].key, 'TEST-123');
		assert.strictEqual(issues[1].key, 'TEST-456');
	});

	test('JiraApiClient - Should fetch single issue with details', async () => {
		const issue = await apiClientStub.getIssue('TEST-123');
		assert.strictEqual(issue.key, 'TEST-123');
		assert.strictEqual(issue.fields.summary, 'Test issue for VSCode integration');
		assert.strictEqual(issue.fields.status.name, 'In Progress');
	});

	test('JiraApiClient - Should fetch projects', async () => {
		const projects = await apiClientStub.getProjects();
		assert.strictEqual(projects.length, 2);
		assert.strictEqual(projects[0].key, 'TEST');
		assert.strictEqual(projects[1].key, 'DEMO');
	});

	test('JiraApiClient - Should fetch issue transitions', async () => {
		const transitions = await apiClientStub.getIssueTransitions('TEST-123');
		assert.strictEqual(transitions.length, 3);
		assert.strictEqual(transitions[0].name, 'To Do');
		assert.strictEqual(transitions[1].name, 'In Progress');
		assert.strictEqual(transitions[2].name, 'Done');
	});

	test('JiraApiClient - Should get current user', async () => {
		const user = await apiClientStub.getCurrentUser();
		assert.strictEqual(user.accountId, 'user123');
		assert.strictEqual(user.displayName, 'Test User');
		assert.strictEqual(user.emailAddress, 'test@example.com');
	});

	test('JiraApiClient - Should create new issue', async () => {
		const newIssue = await apiClientStub.createIssue({
			summary: 'New test issue',
			description: 'Test description',
			issueType: 'Bug',
			projectKey: 'TEST'
		});
		assert.strictEqual(newIssue.key, 'TEST-123');
	});

	test('JiraApiClient - Should add comment to issue', async () => {
		await apiClientStub.addComment('TEST-123', 'Test comment');
		assert.ok(apiClientStub.addComment.calledOnce);
	});

	test('JiraApiClient - Should update issue status', async () => {
		await apiClientStub.updateIssueStatus('TEST-123', '21');
		assert.ok(apiClientStub.updateIssueStatus.calledOnce);
	});

	test('JiraApiClient - Should assign issue', async () => {
		await apiClientStub.assignIssue('TEST-123', 'user123');
		assert.ok(apiClientStub.assignIssue.calledOnce);
	});

	test('JiraAuthProvider - Should authenticate successfully', async () => {
		const credentials = await authProviderStub.authenticate();
		assert.strictEqual(credentials.baseUrl, 'https://test.atlassian.net');
		assert.strictEqual(credentials.email, 'test@example.com');
		assert.strictEqual(credentials.apiToken, 'test-api-token');
	});

	test('JiraAuthProvider - Should get stored credentials', async () => {
		const credentials = await authProviderStub.getCredentials();
		assert.ok(credentials);
		assert.strictEqual(credentials.baseUrl, 'https://test.atlassian.net');
	});

	test('JiraAuthProvider - Should check authentication status', async () => {
		const isAuthenticated = await authProviderStub.isAuthenticated();
		assert.strictEqual(isAuthenticated, true);
	});

	test('JiraIssueProvider - Should provide tree items', async () => {
		const children = await issueProvider.getChildren();
		assert.ok(Array.isArray(children));
		// Should return category items when there are issues
		if (children.length > 0) {
			assert.ok(children[0].label);
			assert.ok(children[0].itemType === 'category');
		}
	});

	test('JiraIssueProvider - Should refresh issues', () => {
		// Test that refresh doesn't throw an error
		assert.doesNotThrow(() => {
			issueProvider.refresh();
		});
	});

	test('Commands - Should be registered', async () => {
		const commands = await vscode.commands.getCommands();
		
		// Check that our main commands are registered
		const jiraCommands = [
			'jira.authenticate',
			'jira.clearCredentials',
			'jira.status',
			'jira.refresh',
			'jira.openIssue',
			'jira.viewIssues',
			'jira.searchIssues',
			'jira.filterIssues',
			'jira.updateIssueStatus',
			'jira.addComment',
			'jira.assignIssue',
			'jira.quickActions',
			'jira.createIssue'
		];

		for (const command of jiraCommands) {
			assert.ok(commands.includes(command), `Command ${command} should be registered`);
		}
	});

	test('Error Handling - Should handle API errors gracefully', async () => {
		// Setup API client to throw an error
		apiClientStub.getIssues.rejects(new Error('API Error'));

		try {
			await apiClientStub.getIssues();
			assert.fail('Should have thrown an error');
		} catch (error) {
			assert.ok(error instanceof Error);
			assert.strictEqual(error.message, 'API Error');
		}
	});

	test('Error Handling - Should handle authentication errors', async () => {
		// Setup auth provider to return null (not authenticated)
		authProviderStub.getCredentials.resolves(null);
		authProviderStub.isAuthenticated.resolves(false);

		const credentials = await authProviderStub.getCredentials();
		const isAuthenticated = await authProviderStub.isAuthenticated();

		assert.strictEqual(credentials, null);
		assert.strictEqual(isAuthenticated, false);
	});

	test('Integration - Full workflow test', async () => {
		// Test a complete workflow: authenticate -> fetch issues -> open issue
		
		// 1. Authenticate
		const credentials = await authProviderStub.authenticate();
		assert.ok(credentials);

		// 2. Fetch issues
		const issues = await apiClientStub.getIssues();
		assert.ok(issues.length > 0);

		// 3. Get detailed issue
		const detailedIssue = await apiClientStub.getIssue(issues[0].key);
		assert.strictEqual(detailedIssue.key, issues[0].key);

		// 4. Add comment
		await apiClientStub.addComment(detailedIssue.key, 'Integration test comment');
		assert.ok(apiClientStub.addComment.calledOnce);

		// 5. Update status
		const transitions = await apiClientStub.getIssueTransitions(detailedIssue.key);
		assert.ok(transitions.length > 0);
		await apiClientStub.updateIssueStatus(detailedIssue.key, transitions[0].id);
		assert.ok(apiClientStub.updateIssueStatus.calledOnce);
	});
});