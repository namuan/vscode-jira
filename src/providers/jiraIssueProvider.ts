import * as vscode from 'vscode';
import { JiraApiClient, JiraIssue } from '../api/jiraApiClient';
import { logDebug, logInfo, logError } from '../utils/logger';

interface JiraTreeItem extends vscode.TreeItem {
	issue?: JiraIssue;
	itemType: 'category' | 'issue';
}

export class JiraIssueProvider implements vscode.TreeDataProvider<JiraTreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<JiraTreeItem | undefined | null | void> = new vscode.EventEmitter<JiraTreeItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<JiraTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
	private issues: JiraIssue[] = [];
	private isLoading = false;

	constructor(private jiraApiClient: JiraApiClient) { }

	refresh(): void {
		logDebug('Refreshing Jira issues tree');
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: JiraTreeItem): vscode.TreeItem {
		if (element.itemType === 'category') {
			return element;
		}

		if (!element.issue) {
			return element;
		}

		const issue = element.issue;
		const item = new vscode.TreeItem(
			`${issue.key}: ${this.truncateText(issue.fields.summary, 50)}`,
			vscode.TreeItemCollapsibleState.None
		);

		// Enhanced description with priority and assignee
		let description = issue.fields.status.name;
		if (issue.fields.priority) {
			description += ` • ${issue.fields.priority.name}`;
		}
		if (issue.fields.assignee) {
			description += ` • ${issue.fields.assignee.displayName}`;
		}
		item.description = description;

		// Enhanced tooltip with more information
		const createdDate = new Date(issue.fields.created).toLocaleDateString();
		const updatedDate = new Date(issue.fields.updated).toLocaleDateString();
		item.tooltip = new vscode.MarkdownString(
			`**${issue.key}**: ${issue.fields.summary}\n\n` +
			`**Status**: ${issue.fields.status.name}\n` +
			`**Type**: ${issue.fields.issuetype.name}\n` +
			`**Project**: ${issue.fields.project.name}\n` +
			`**Priority**: ${issue.fields.priority?.name || 'None'}\n` +
			`**Assignee**: ${issue.fields.assignee?.displayName || 'Unassigned'}\n` +
			`**Created**: ${createdDate}\n` +
			`**Updated**: ${updatedDate}\n\n` +
			`${issue.fields.description ? this.truncateText(issue.fields.description, 200) : 'No description'}`
		);

		item.contextValue = 'jiraIssue';
		item.command = {
			command: 'jira.openIssue',
			title: 'Open Issue',
			arguments: [issue]
		};

		// Set icon based on issue type and status
		item.iconPath = this.getIssueIcon(issue);

		return item;
	}

	async getChildren(element?: JiraTreeItem): Promise<JiraTreeItem[]> {
		if (element) {
			// Handle category expansion
			if (element.itemType === 'category') {
				return this.getIssuesForCategory(element.label as string);
			}
			// No children for individual issues
			return [];
		}

		// Root level - show categories
		try {
			if (this.isLoading) {
				return [this.createLoadingItem()];
			}

			logDebug('Starting to load Jira issues');
			this.isLoading = true;
			this.issues = await this.jiraApiClient.getIssues();
			this.isLoading = false;
			logInfo(`Successfully loaded ${this.issues.length} Jira issues`);

			if (this.issues.length === 0) {
				return [this.createEmptyItem()];
			}

			return this.createCategoryItems();
		} catch (error) {
			this.isLoading = false;
			logError('Failed to load Jira issues', error as Error);
			vscode.window.showErrorMessage(`Failed to load Jira issues: ${error}`);
			return [this.createErrorItem()];
		}
	}

	private getIssuesForCategory(category: string): JiraTreeItem[] {
		let filteredIssues: JiraIssue[];

		switch (category) {
			case 'In Progress':
				filteredIssues = this.issues.filter(issue =>
					issue.fields.status.name.toLowerCase().includes('progress') ||
					issue.fields.status.name.toLowerCase().includes('development')
				);
				break;
			case 'To Do':
				filteredIssues = this.issues.filter(issue =>
					issue.fields.status.name.toLowerCase().includes('to do') ||
					issue.fields.status.name.toLowerCase().includes('open') ||
					issue.fields.status.name.toLowerCase().includes('backlog')
				);
				break;
			case 'Review':
				filteredIssues = this.issues.filter(issue =>
					issue.fields.status.name.toLowerCase().includes('review') ||
					issue.fields.status.name.toLowerCase().includes('testing')
				);
				break;
			case 'Done':
				filteredIssues = this.issues.filter(issue =>
					issue.fields.status.name.toLowerCase().includes('done') ||
					issue.fields.status.name.toLowerCase().includes('closed') ||
					issue.fields.status.name.toLowerCase().includes('resolved')
				);
				break;
			default:
				filteredIssues = this.issues;
		}

		return filteredIssues.map(issue => ({
			label: `${issue.key}: ${this.truncateText(issue.fields.summary, 40)}`,
			collapsibleState: vscode.TreeItemCollapsibleState.None,
			issue,
			itemType: 'issue' as const
		}));
	}

	private createCategoryItems(): JiraTreeItem[] {
		const categories = [
			{ name: 'In Progress', icon: 'play', count: 0 },
			{ name: 'To Do', icon: 'circle-outline', count: 0 },
			{ name: 'Review', icon: 'eye', count: 0 },
			{ name: 'Done', icon: 'check', count: 0 }
		];

		// Count and log issues in each category
		categories.forEach(category => {
			logDebug(`Counting issues for category: ${category.name}`);
			switch (category.name) {
				case 'In Progress':
					category.count = this.issues.filter(issue =>
						issue.fields.status.name.toLowerCase().includes('progress') ||
						issue.fields.status.name.toLowerCase().includes('development')
					).length;
					break;
				case 'To Do':
					category.count = this.issues.filter(issue =>
						issue.fields.status.name.toLowerCase().includes('to do') ||
						issue.fields.status.name.toLowerCase().includes('open') ||
						issue.fields.status.name.toLowerCase().includes('backlog')
					).length;
					break;
				case 'Review':
					category.count = this.issues.filter(issue =>
						issue.fields.status.name.toLowerCase().includes('review') ||
						issue.fields.status.name.toLowerCase().includes('testing')
					).length;
					break;
				case 'Done':
					category.count = this.issues.filter(issue =>
						issue.fields.status.name.toLowerCase().includes('done') ||
						issue.fields.status.name.toLowerCase().includes('closed') ||
						issue.fields.status.name.toLowerCase().includes('resolved')
					).length;
					break;
			}
		});

		return categories
			.filter(category => category.count > 0)
			.map(category => ({
				label: `${category.name} (${category.count})`,
				collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
				iconPath: new vscode.ThemeIcon(category.icon),
				contextValue: 'jiraCategory',
				itemType: 'category' as const
			}));
	}

	private createLoadingItem(): JiraTreeItem {
		return {
			label: 'Loading Jira issues...',
			collapsibleState: vscode.TreeItemCollapsibleState.None,
			iconPath: new vscode.ThemeIcon('loading~spin'),
			itemType: 'category'
		};
	}

	private createEmptyItem(): JiraTreeItem {
		return {
			label: 'No issues found',
			collapsibleState: vscode.TreeItemCollapsibleState.None,
			iconPath: new vscode.ThemeIcon('info'),
			contextValue: 'jiraEmpty',
			itemType: 'category'
		};
	}

	private createErrorItem(): JiraTreeItem {
		return {
			label: 'Failed to load issues',
			collapsibleState: vscode.TreeItemCollapsibleState.None,
			iconPath: new vscode.ThemeIcon('error'),
			contextValue: 'jiraError',
			command: {
				command: 'jira.refresh',
				title: 'Retry'
			},
			itemType: 'category'
		};
	}

	private getIssueIcon(issue: JiraIssue): vscode.ThemeIcon {
		const issueType = issue.fields.issuetype.name.toLowerCase();
		const status = issue.fields.status.name.toLowerCase();

		// Priority-based color coding
		let color: vscode.ThemeColor | undefined;
		if (issue.fields.priority) {
			const priority = issue.fields.priority.name.toLowerCase();
			if (priority.includes('highest') || priority.includes('critical')) {
				color = new vscode.ThemeColor('errorForeground');
			} else if (priority.includes('high')) {
				color = new vscode.ThemeColor('warningForeground');
			}
		}

		// Icon based on issue type
		let iconId: string;
		switch (issueType) {
			case 'bug':
				iconId = 'bug';
				break;
			case 'task':
				iconId = 'checklist';
				break;
			case 'story':
			case 'user story':
				iconId = 'book';
				break;
			case 'epic':
				iconId = 'project';
				break;
			case 'subtask':
			case 'sub-task':
				iconId = 'list-tree';
				break;
			default:
				iconId = 'circle-outline';
		}

		// Modify icon based on status
		if (status.includes('done') || status.includes('closed') || status.includes('resolved')) {
			iconId = 'check';
			color = new vscode.ThemeColor('charts.green');
		} else if (status.includes('progress') || status.includes('development')) {
			iconId = 'play';
			color = new vscode.ThemeColor('charts.blue');
		}

		return new vscode.ThemeIcon(iconId, color);
	}

	private truncateText(text: string, maxLength: number): string {
		if (text.length <= maxLength) {
			return text;
		}
		return text.substring(0, maxLength - 3) + '...';
	}

	getIssues(): JiraIssue[] {
		return this.issues;
	}
}