import * as vscode from 'vscode';
import axios from 'axios';
import { logDebug, logInfo, logError, logWarning } from '../utils/logger';

export interface JiraCredentials {
	baseUrl: string;
	email: string;
	apiToken: string;
}

export class JiraAuthProvider {
	private static readonly CREDENTIALS_KEY = 'jira.credentials';
	private static readonly LAST_VALIDATED_KEY = 'jira.lastValidated';
	private static readonly VALIDATION_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

	constructor(private context: vscode.ExtensionContext) { }

	async authenticate(): Promise<JiraCredentials> {
		logInfo('Starting Jira authentication flow');
		// Get Jira base URL
		const baseUrl = await vscode.window.showInputBox({
			prompt: 'Enter your Jira base URL',
			placeHolder: 'https://your-domain.atlassian.net',
			validateInput: (value) => {
				if (!value || !value.startsWith('https://')) {
					return 'Please enter a valid HTTPS URL';
				}
				return null;
			}
		});

		if (!baseUrl) {
			throw new Error('Base URL is required');
		}

		// Get email
		const email = await vscode.window.showInputBox({
			prompt: 'Enter your Jira email address',
			placeHolder: 'your-email@example.com',
			validateInput: (value) => {
				if (!value || !value.includes('@')) {
					return 'Please enter a valid email address';
				}
				return null;
			}
		});

		if (!email) {
			throw new Error('Email is required');
		}

		// Get API token
		const apiToken = await vscode.window.showInputBox({
			prompt: 'Enter your Jira API token',
			placeHolder: 'Your API token from Atlassian account settings',
			password: true,
			validateInput: (value) => {
				if (!value || value.length < 10) {
					return 'Please enter a valid API token';
				}
				return null;
			}
		});

		if (!apiToken) {
			throw new Error('API token is required');
		}

		const credentials: JiraCredentials = {
			baseUrl: baseUrl.replace(/\/$/, ''), // Remove trailing slash
			email,
			apiToken
		};

		logDebug('Received authentication credentials', { baseUrl: credentials.baseUrl });
		// Validate credentials by testing API connection
		await this.validateCredentials(credentials);

		// Store credentials securely
		logDebug('Storing Jira credentials in secure storage');
		await this.context.secrets.store(JiraAuthProvider.CREDENTIALS_KEY, JSON.stringify(credentials));

		return credentials;
	}

	async getCredentials(): Promise<JiraCredentials | null> {
		try {
			const stored = await this.context.secrets.get(JiraAuthProvider.CREDENTIALS_KEY);
			if (stored) {
				logDebug('Retrieved stored Jira credentials');
				const credentials = JSON.parse(stored) as JiraCredentials;

				// Check if credentials need revalidation
				const shouldRevalidate = await this.shouldRevalidateCredentials();
				if (shouldRevalidate) {
					logDebug('Revalidating stored credentials');
					try {
						await this.validateCredentials(credentials, false); // Silent validation
						await this.updateLastValidated();
						logInfo('Credentials revalidation successful');
					} catch (error) {
						logError('Credentials revalidation failed', error as Error);
						// Credentials are invalid, clear them
						await this.clearCredentials();
						vscode.window.showWarningMessage('Your Jira credentials have expired or become invalid. Please re-authenticate.');
						return null;
					}
				}

				return credentials;
			}
		} catch (error) {
			// Handle parsing errors gracefully
			logError('Error parsing stored credentials', error as Error);
			await this.clearCredentials(); // Clear corrupted credentials
		}
		return null;
	}

	async clearCredentials(): Promise<void> {
		logInfo('Clearing Jira credentials');
		await this.context.secrets.delete(JiraAuthProvider.CREDENTIALS_KEY);
		await this.context.globalState.update(JiraAuthProvider.LAST_VALIDATED_KEY, undefined);
		vscode.commands.executeCommand('setContext', 'jira:authenticated', false);
	}

	async isAuthenticated(): Promise<boolean> {
		const credentials = await this.getCredentials();
		return credentials !== null;
	}

	async getAuthenticationStatus(): Promise<{ authenticated: boolean; user?: string; baseUrl?: string }> {
		const credentials = await this.getCredentials();
		if (!credentials) {
			return { authenticated: false };
		}

		try {
			const authHeader = `Basic ${Buffer.from(`${credentials.email}:${credentials.apiToken}`).toString('base64')}`;
			const response = await axios.get(`${credentials.baseUrl}/rest/api/3/myself`, {
				headers: {
					'Authorization': authHeader,
					'Accept': 'application/json'
				},
				timeout: 5000
			});

			return {
				authenticated: true,
				user: response.data.displayName || response.data.emailAddress,
				baseUrl: credentials.baseUrl
			};
		} catch (error) {
			return { authenticated: false };
		}
	}

	private async shouldRevalidateCredentials(): Promise<boolean> {
		const lastValidated = this.context.globalState.get<number>(JiraAuthProvider.LAST_VALIDATED_KEY);
		if (!lastValidated) {
			return true;
		}

		const now = Date.now();
		return (now - lastValidated) > JiraAuthProvider.VALIDATION_INTERVAL;
	}

	private async updateLastValidated(): Promise<void> {
		await this.context.globalState.update(JiraAuthProvider.LAST_VALIDATED_KEY, Date.now());
	}

	private async validateCredentials(credentials: JiraCredentials, showSuccessMessage: boolean = true): Promise<void> {
		logDebug('Validating Jira credentials', { baseUrl: credentials.baseUrl });
		try {
			const authHeader = `Basic ${Buffer.from(`${credentials.email}:${credentials.apiToken}`).toString('base64')}`;

			// Test authentication by calling the current user endpoint
			const response = await axios.get(`${credentials.baseUrl}/rest/api/3/myself`, {
				headers: {
					'Authorization': authHeader,
					'Accept': 'application/json'
				},
				timeout: 10000
			});

			if (response.status !== 200) {
				throw new Error('Authentication failed');
			}

			// Verify we got user data
			if (!response.data || !response.data.emailAddress) {
				throw new Error('Invalid response from Jira API');
			}

			const user = response.data.displayName || response.data.emailAddress;
			logInfo(`Successfully authenticated with Jira as ${user}`);
			if (showSuccessMessage) {
				vscode.window.showInformationMessage(`Successfully authenticated as ${user}`);
			}
		} catch (error: any) {
			const validationError = new Error(error.message);
			(validationError as any).baseUrl = credentials.baseUrl;
			(validationError as any).status = error.response?.status;
			(validationError as any).code = error.code;
			logError('Jira credential validation failed', validationError);

			if (error.response) {
				if (error.response.status === 401) {
					throw new Error('Invalid email or API token. Please check your credentials.');
				} else if (error.response.status === 403) {
					throw new Error('Access denied. Please check your Jira permissions.');
				} else {
					throw new Error(`Jira API error: ${error.response.status} - ${error.response.statusText}`);
				}
			} else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
				throw new Error('Cannot connect to Jira. Please check your base URL and internet connection.');
			} else {
				throw new Error(`Authentication failed: ${error.message}`);
			}
		}
	}
}
