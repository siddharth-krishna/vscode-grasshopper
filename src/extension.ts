'use strict';

import * as path from 'path';
import * as cp from 'child_process';
import ChildProcess = cp.ChildProcess;

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';


class State {
    public static diagnostics: vscode.DiagnosticCollection;

    public static initialize() {
        this.diagnostics = vscode.languages.createDiagnosticCollection('Grasshopper');
    }
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    State.initialize();
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('grasshopper.verifyFile', verifyFile);

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }

function verifyFile(): void {
    if (vscode.window.activeTextEditor) {
        let document = vscode.window.activeTextEditor.document;
        let options = undefined;
        // vscode.workspace.rootPath ? { cwd: vscode.workspace.rootPath } : undefined;
        let filePath = vscode.window.activeTextEditor.document.fileName;
        let args = [filePath];
        let rawResult = '';

        let childProcess = cp.spawn('grasshopper', args, options);
        childProcess.on('error', (err) => {
            console.log('Failed to start subprocess.\n' + err);
        });
        if (childProcess.pid) {
            childProcess.stdout.on('data', (data: Buffer) => rawResult += data);
            childProcess.stderr.on('data', (data: Buffer) => rawResult += data);
            childProcess.on('close', (code: Number, _: string) => {
                console.log(rawResult);
                let lines = rawResult.split('\n');
                let errorRegex = '^File "([^"]*)", line (\\d+), columns (\\d+)-(\\d+):$';
                let errorRegex2 =
                    '^File "([^"]*)", line (\\d+), column (\\d+) to line (\\d+), column (\\d+):$';
                let i = 0;
                let diags = [];
                while (i < lines.length) {
                    let res = lines[i].match(errorRegex);
                    let res2 = lines[i].match(errorRegex2);
                    if (res) {
                        let errorFile = res[1];  // TODO ensure this matches current file
                        let lineNum = Number(res[2]) - 1;
                        let startChar = Number(res[3]);
                        let endChar = Number(res[4]);
                        let msg = lines[++i];

                        diags.push(new vscode.Diagnostic(
                            new vscode.Range(new vscode.Position(lineNum, startChar),
                                new vscode.Position(lineNum, endChar)),
                            msg,
                            (msg.startsWith('Error') ?
                                vscode.DiagnosticSeverity.Error
                                : vscode.DiagnosticSeverity.Information)
                            // relatedInformation: [  // TODO
                            //     new vscode.DiagnosticRelatedInformation(new vscode.Location(document.uri, new vscode.Range(new vscode.Position(1, 8), new vscode.Position(1, 9))), 'first assignment to `x`')
                            // ]
                        ));
                    } else if (res2) {
                        let errorFile = res2[1];
                        let startLine = Number(res2[2]) - 1;
                        let startChar = Number(res2[3]);
                        let endLine = Number(res2[4]) - 1;
                        let endChar = Number(res2[5]);
                        let msg = lines[++i];

                        diags.push(new vscode.Diagnostic(
                            new vscode.Range(new vscode.Position(startLine, startChar),
                                new vscode.Position(endLine, endChar)),
                            msg,
                            (msg.startsWith('Error') ?
                                vscode.DiagnosticSeverity.Error
                                : vscode.DiagnosticSeverity.Information)
                        ));
                    } else if (lines[i].trim() !== '') {
                        console.log("Couldn't match line:");
                        console.log(lines[i]);
                    }
                    i++;
                }
                State.diagnostics.set(document.uri, diags);
                let fileName = filePath.split('/').pop();
                if (code === 0) {
                    vscode.window.showInformationMessage(
                        'Grasshopper: ' + fileName + ' verified successfully.');
                } else if (diags.length > 0) {
                    vscode.window.showInformationMessage(
                        'Grasshopper: ' + fileName + ': ' + diags.length + ' errors.');
                } else {
                    vscode.window.showErrorMessage(
                        'Grasshopper: ' + fileName + ': verification failed with code ' + code);
                }
            });
        } else {
            vscode.window.showErrorMessage(
                'Grasshopper: Failed to start subprocess.');
        }
    } else {
        vscode.window.showErrorMessage('Grasshopper: No active window.');
    }

}