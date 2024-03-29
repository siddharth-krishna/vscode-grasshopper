# VS Code Grasshopper Extension

A Grasshopper language extension for VS Code. Supports basic syntax highlighting and Grasshopper verification.

<!-- ## Features

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow. -->

## Requirements

The [Grasshopper](https://github.com/wies/grasshopper/) verification tool.
This extension currently assumes it is installed and the path contains a `grasshopper` command.


## Feature TODOs

* Add "verify this procedure".
* Cancel on "verifying" window should kill process.
* Log Grasshopper output to output tray.
* Put error diagnostic only on `assert` or `pure assert`, as assertion is covered by related information.
* Add diagnostics to other files if in workspace.
* Syntax highlight: TODO, macro/lemma/procedure names, types (don't highlight "bool"), ghost, implicit, highlight matching <>,
* Type Errors appear as warnings not errors.
* Map `verifyFile` to `F5` only when Grasshopper file is active.
* Show running time in status bar.
* Add settings: keybinding, save-before-verify, ghp path.
* Better syntax highlighting: arithmetic expressions, procedure names.
* Display math operators using unicode symbols.
* Snippets for assert/assume/etc.

<!-- ## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: enable/disable this extension
* `myExtension.thing`: set to `blah` to do something

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z. -->

**Enjoy!**
