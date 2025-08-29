import * as vscode from 'vscode';

/**
 * Enhanced logger utility for VS Code extension
 * Logs to both console and VS Code output channel when available
 */
interface LogContext {
    [key: string]: unknown;
}

let outputChannel: vscode.OutputChannel | undefined;

export function initializeLogger(channel: vscode.OutputChannel) {
    outputChannel = channel;
}

function writeToOutput(message: string) {
    if (outputChannel) {
        outputChannel.appendLine(message);
    }
}

export const logInfo = (message: string, context?: LogContext) => {
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    const fullMessage = `[INFO] ${new Date().toISOString()} - ${message}${contextStr}`;
    console.log(fullMessage);
    writeToOutput(fullMessage);
};

export const logDebug = (message: string, context?: LogContext) => {
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    const fullMessage = `[DEBUG] ${new Date().toISOString()} - ${message}${contextStr}`;
    console.debug(fullMessage);
    writeToOutput(fullMessage);
};

export const logError = (message: string, error?: Error, context?: LogContext) => {
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    const errorStr = error ? `\n${error.stack || error.message}` : '';
    const fullMessage = `[ERROR] ${new Date().toISOString()} - ${message}${contextStr}${errorStr}`;
    console.error(fullMessage);
    writeToOutput(fullMessage);
};

export const logWarning = (message: string, context?: LogContext) => {
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    const fullMessage = `[WARN] ${new Date().toISOString()} - ${message}${contextStr}`;
    console.warn(fullMessage);
    writeToOutput(fullMessage);
};