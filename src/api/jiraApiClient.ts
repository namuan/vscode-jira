import axios, { AxiosInstance, AxiosError } from 'axios';
import { JiraCredentials } from '../auth/jiraAuthProvider';
import * as vscode from 'vscode';

export interface JiraIssue {
	key: string;
	fields: {
		summary: string;
		description?: string;
		status: {
			name: string;
		};
		issuetype: {
			name: string;
		};
		project: {
			key: string;
			name: string;
		};
		priority?: {
			name: string;
		};
		assignee?: {
			displayName: string;
			emailAddress: string;
		};
		reporter?: {
			displayName: string;
			emailAddress: string;
		};
		resolution?: {
			name: string;
		};
		comment?: {
			comments: Array<{
				id: string;
				author: {
					displayName: string;
				};
				body: any;
				created: string;
			}>;
		};
		created: string;
		updated: string;
	};
}

export interface CreateIssueRequest {
	summary: string;
	description: string;
	issueType?: string;
	projectKey?: string;
	priority?: string;
}

export class JiraApiClient {
	private axiosInstance: AxiosInstance | null = null;
	private credentials: JiraCredentials | null = null;
	private readonly maxRetries = 3;
	private readonly retryDelay = 1000; // 1 second

	setCredentials(credentials: JiraCredentials): void {
		this.credentials = credentials;
		this.axiosInstance = axios.create({
			baseURL: `${credentials.baseUrl}/rest/api/3`,
			headers: {
				'Authorization': `Basic ${Buffer.from(`${credentials.email}:${credentials.apiToken}`).toString('base64')}`,
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'User-Agent': 'VSCode-Jira-Integration/1.0.0'
			},
			timeout: 15000
		});

		// Add response interceptor for better error handling
		this.axiosInstance.interceptors.response.use(
			(response) => response,
			(error: AxiosError) => {
				return Promise.reject(this.handleApiError(error));
			}
		);
	}

	async getIssues(jql?: string, maxResults: number = 50): Promise<JiraIssue[]> {
		if (!this.axiosInstance) {
			throw new Error('Not authenticated. Please set credentials first.');
		}

		const searchJql = jql || 'assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC';
		return this.executeWithRetry(async () => {
			const response = await this.axiosInstance!.get('/search', {
				params: {
					jql: searchJql,
					maxResults,
					fields: 'summary,description,status,issuetype,project,assignee,priority,created,updated'
				}
			});

			return response.data.issues || [];
		}, 'fetch issues');
	}

	async getIssue(issueKey: string): Promise<JiraIssue> {
		if (!this.axiosInstance) {
			throw new Error('Not authenticated. Please set credentials first.');
		}

		return this.executeWithRetry(async () => {
			const response = await this.axiosInstance!.get(`/issue/${issueKey}`, {
				params: {
					fields: 'summary,description,status,issuetype,project,assignee,priority,created,updated,comment'
				}
			});

			return response.data;
		}, `fetch issue ${issueKey}`);
	}

	async updateIssueStatus(issueKey: string, transitionId: string): Promise<void> {
		if (!this.axiosInstance) {
			throw new Error('Not authenticated. Please set credentials first.');
		}

		return this.executeWithRetry(async () => {
			await this.axiosInstance!.post(`/issue/${issueKey}/transitions`, {
				transition: {
					id: transitionId
				}
			});
		}, `update status for issue ${issueKey}`);
	}

	async addComment(issueKey: string, comment: string): Promise<void> {
		if (!this.axiosInstance) {
			throw new Error('Not authenticated. Please set credentials first.');
		}

		return this.executeWithRetry(async () => {
			await this.axiosInstance!.post(`/issue/${issueKey}/comment`, {
				body: {
					type: 'doc',
					version: 1,
					content: [
						{
							type: 'paragraph',
							content: [
								{
									type: 'text',
									text: comment
								}
							]
						}
					]
				}
			});
		}, `add comment to issue ${issueKey}`);
	}

	async createIssue(request: CreateIssueRequest): Promise<JiraIssue> {
		if (!this.axiosInstance || !this.credentials) {
			throw new Error('Not authenticated. Please set credentials first.');
		}

		return this.executeWithRetry(async () => {
				// Get available projects to use the first one as default
				const projectKey = request.projectKey || await this.getDefaultProjectKey();
				const issueType = request.issueType || 'Task';

				const issueData: any = {
					fields: {
						project: {
							key: projectKey
						},
						summary: request.summary,
						description: {
							type: 'doc',
							version: 1,
							content: [
								{
									type: 'paragraph',
									content: [
										{
											type: 'text',
											text: request.description
										}
									]
								}
							]
						},
						issuetype: {
							name: issueType
						}
					}
				};

				// Add priority if specified
				if (request.priority) {
					issueData.fields.priority = {
						name: request.priority
					};
				}

			const response = await this.axiosInstance!.post('/issue', issueData);
			
			// Fetch the created issue to return complete data
			const createdIssue = await this.axiosInstance!.get(`/issue/${response.data.key}`, {
				params: {
					fields: 'summary,description,status,issuetype,project,assignee,priority,created,updated'
				}
			});

			return createdIssue.data;
		}, 'create issue');
	}

	async getProjects(): Promise<Array<{ key: string; name: string; id: string }>> {
		if (!this.axiosInstance) {
			throw new Error('Not authenticated. Please set credentials first.');
		}

		return this.executeWithRetry(async () => {
			const response = await this.axiosInstance!.get('/project/search', {
				params: {
					maxResults: 100
				}
			});

			return response.data.values || [];
		}, 'fetch projects');
	}

	async getIssueTransitions(issueKey: string): Promise<Array<{ id: string; name: string }>> {
		if (!this.axiosInstance) {
			throw new Error('Not authenticated. Please set credentials first.');
		}

		return this.executeWithRetry(async () => {
			const response = await this.axiosInstance!.get(`/issue/${issueKey}/transitions`);
			return response.data.transitions || [];
		}, `fetch transitions for issue ${issueKey}`);
	}

	async getCurrentUser(): Promise<{ accountId: string; displayName: string; emailAddress: string }> {
		if (!this.axiosInstance) {
			throw new Error('Not authenticated. Please set credentials first.');
		}

		return this.executeWithRetry(async () => {
			const response = await this.axiosInstance!.get('/myself');
			return {
				accountId: response.data.accountId,
				displayName: response.data.displayName,
				emailAddress: response.data.emailAddress
			};
		}, 'fetch current user');
	}

	async assignIssue(issueKey: string, assigneeId: string | null): Promise<void> {
		if (!this.axiosInstance) {
			throw new Error('Not authenticated. Please set credentials first.');
		}

		return this.executeWithRetry(async () => {
			const assigneeData = assigneeId ? { accountId: assigneeId } : null;
			await this.axiosInstance!.put(`/issue/${issueKey}/assignee`, {
				assignee: assigneeData
			});
		}, `assign issue ${issueKey}`);
	}

	private async getDefaultProjectKey(): Promise<string> {
		const projects = await this.getProjects();
		if (projects.length === 0) {
			throw new Error('No accessible projects found');
		}
		return projects[0].key;
	}

	private async executeWithRetry<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
		let lastError: Error = new Error(`Failed to ${operationName} after ${this.maxRetries} attempts`);
		
		for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
			try {
				return await operation();
			} catch (error: any) {
				lastError = error;
				
				// Don't retry on authentication errors or client errors (4xx)
				if (error.status === 401 || error.status === 403 || (error.status >= 400 && error.status < 500)) {
					break;
				}
				
				// Don't retry on the last attempt
				if (attempt === this.maxRetries) {
					break;
				}
				
				// Wait before retrying (exponential backoff)
				const delay = this.retryDelay * Math.pow(2, attempt - 1);
				vscode.window.showWarningMessage(`Failed to ${operationName}, retrying in ${delay/1000}s... (attempt ${attempt}/${this.maxRetries})`);
				await new Promise(resolve => setTimeout(resolve, delay));
			}
		}
		
		throw lastError;
	}

	private handleApiError(error: AxiosError): Error {
		if (error.response) {
			const status = error.response.status;
			const data = error.response.data as any;
			
			let message = `Jira API error (${status})`;
			
			if (data?.errorMessages && data.errorMessages.length > 0) {
				message += `: ${data.errorMessages[0]}`;
			} else if (data?.message) {
				message += `: ${data.message}`;
			} else {
				message += `: ${error.response.statusText}`;
			}
			
			const apiError = new Error(message);
			(apiError as any).status = status;
			(apiError as any).response = error.response;
			return apiError;
		} else if (error.request) {
			return new Error('Network error: Unable to connect to Jira. Please check your internet connection.');
		} else {
			return new Error(`Request error: ${error.message}`);
		}
	}
}