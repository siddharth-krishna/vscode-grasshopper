'use strict';

import * as childProcess from 'child_process';

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

function callGrasshopper(document: vscode.TextDocument, filePath: string,
  token: vscode.CancellationToken): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let rawResult = '';
    let ghpArgs: string[] = []; // TODO get args from user
    let args = ['-f', 'TIME %e', 'grasshopper'].concat(ghpArgs, [filePath]);

    console.log(`\\n${new Date().toLocaleString()}\\ntime ${args.join(' ')}`);
    let cp = childProcess.spawn('time', args, undefined)
      .on('error', (err) => {
        vscode.window.showErrorMessage(
          'Grasshopper: Failed to start subprocess.');
        reject();
      });
    cp.stdout.on('data', (data: Buffer) => rawResult += data);
    cp.stderr.on('data', (data: Buffer) => rawResult += data);
    token.onCancellationRequested(() => cp.kill('SIGINT'));

    cp.on('close', (code: Number, _: string) => {
      console.log(rawResult);
      let lines = rawResult.split('\n');
      let errorRegex = '^File "([^"]*)", line (\\d+), columns (\\d+)-(\\d+):$';
      let errorRegex2 =
        '^File "([^"]*)", line (\\d+), column (\\d+) to line (\\d+), column (\\d+):$';
      let i = 0;
      let diags = [];
      let time = '';
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
        } else if (lines[i].startsWith('TIME')) {
          let rawSecs = lines[i].split(' ')[1];
          let mins = Math.floor(+rawSecs / 60);
          let secs = (+rawSecs % 60).toFixed(1);
          time = (mins > 0 ? mins + 'm' : '') + secs + 's';
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
          `Grasshopper: ${fileName} verified successfully (${time}).`);
      } else if (diags.length > 0) {
        vscode.window.showInformationMessage(
          `Grasshopper: ${fileName}: ${diags.length} errors (${time}).`);
      } else if (code === 130) {
        vscode.window.showInformationMessage(
          `Grasshopper: interrupted (${time}).`);
      } else {
        vscode.window.showErrorMessage(
          `Grasshopper: verification failed with code ${code} (${time}).`);
      }
      resolve();
    });
    if (!cp.pid) {
      vscode.window.showErrorMessage('Grasshopper: Failed to start subprocess.');
      reject();
    }
  });
}

function verifyFile(): void {
  if (vscode.window.activeTextEditor) {
    let document = vscode.window.activeTextEditor.document;
    // vscode.workspace.rootPath ? { cwd: vscode.workspace.rootPath } : undefined;
    let filePath = vscode.window.activeTextEditor.document.fileName;
    let fileName = filePath.split('/').pop();

    // Create a progress bar notification:
    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: `Grasshopper: verifying ${fileName}...`,
      cancellable: true
    }, (_progress, token) => callGrasshopper(document, filePath, token));
  } else {
    vscode.window.showErrorMessage('Grasshopper: No active window.');
  }
}