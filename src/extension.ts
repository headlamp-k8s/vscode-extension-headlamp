import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  /**
   * Ask the user to show a README.md if they haven't see it.
   */
  function showReadme() {
    const CURRENT_README = 1;
    const hasShownReadme = parseInt(
      context.globalState.get("hasShownReadme") || "0"
    );
    if (hasShownReadme < CURRENT_README) {
      vscode.window
        .showInformationMessage(
          "Would you like to see the Headlamp extension README file?",
          "Yes",
          "No"
        )
        .then((selection) => {
          if (selection === "Yes") {
            vscode.commands.executeCommand(
              "markdown.showPreview",
              vscode.Uri.file(context.asAbsolutePath("README.md"))
            );
          }
        });

      context.globalState.update("hasShownReadme", CURRENT_README);
    }
  }

  /**
   * Register the "Create new Headlamp Plugin" command.
   *
   * @see package.json contributes.commands
   */
  function addCreateNewPluginCommand() {
    let disposable = vscode.commands.registerCommand(
      "headlamp.createNewPlugin",
      () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        vscode.window.showInformationMessage(
          "Hello World from Headlamp vscode extension!"
        );

        vscode.window
          .showInputBox({
            prompt: "What is the name of the plugin you want to make?",
            placeHolder: "eg. my-plugin",
            value: "",
          })
          .then((name) => {
            if (name) {
              const terminal = vscode.window.createTerminal("Headlamp Plugin");
              terminal.show();
              terminal.sendText(
                `npx --yes @kinvolk/headlamp-plugin create ${name}`,
                true
              );
            } else {
              vscode.window.showErrorMessage("Please enter a valid name.");
            }
          });
      }
    );

    context.subscriptions.push(disposable);
  }

  // Add "Run Headlamp from an existing clone" feature, and offer to clone it if it doesn't exist
  // To run headlamp: "cd app && npm start"
  // call the command "Run Headlamp from an existing clone"
  // if the folder doesn't exist, clone it
  function addRunHeadlampCommand() {
    let disposable = vscode.commands.registerCommand(
      "headlamp.runHeadlamp",
      () => {
        // import fs
        const fs = require("fs");
        const path = require("path");

        /**
         * See if there is a 'headlamp' folder if we are in a headlamp folder.
         *
         * @param folderPath to check
         * @returns true if the folder exists and is a headlamp folder
         */
        function isHeadlampFolder(folderPath: string): boolean {
          if (folderPath.endsWith("headlamp") && fs.existsSync(folderPath)) {
            return true;
          }
          return false;
        }

        const currentFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
        vscode.window.showInformationMessage(
          `Looking in Current folder: ${currentFolder} for Headlamp source...`
        );

        let createHeadlampFolder = false;
        let headlampFolder = currentFolder || "./";
        if (!(currentFolder && isHeadlampFolder(currentFolder))) {
          headlampFolder = path.join(currentFolder, "headlamp");
          if (!isHeadlampFolder(headlampFolder)) {
            createHeadlampFolder = true;
          }
        }

        function runHeadlamp() {
          let cmd = `cd ${headlampFolder}/ && `;

          let terminalBackend = vscode.window.terminals.find(
            (term) => term.name === "Headlamp backend"
          );
          if (!terminalBackend) {
            terminalBackend = vscode.window.createTerminal("Headlamp backend");
          }
          terminalBackend.show();
          terminalBackend.sendText(
            cmd + "make backend && make run-backend",
            true
          );

          let terminal = vscode.window.terminals.find(
            (term) => term.name === "Headlamp frontend"
          );
          if (!terminal) {
            terminal = vscode.window.createTerminal("Headlamp frontend");
          }
          terminal.show();
          terminal.sendText(cmd + "make frontend && make run-frontend", true);
        }

        function cloneAndRunHeadlamp() {
          // there's no headlamp, so clone the headlamp-k8s/headlamp github repo with ssh
          if (createHeadlampFolder) {
            vscode.window.showInformationMessage(
              "Headlamp folder not found. Cloning the Headlamp repo..."
            );
            const cloneCmd = `git clone git@github.com:headlamp-k8s/headlamp.git && exit`;

            let terminal = vscode.window.terminals.find(
              (term) => term.name === "Headlamp clone"
            );
            if (!terminal) {
              terminal = vscode.window.createTerminal("Headlamp clone");
            }
            terminal.show();
            terminal.sendText(cloneCmd, true);
          }

          vscode.window.onDidCloseTerminal((terminal) => {
            if (terminal.name === "Headlamp clone") {
              vscode.window.showInformationMessage(
                "Git clone of headlamp complete. Running Headlamp..."
              );

              runHeadlamp();
            }
          });
        }

        if (createHeadlampFolder) {
          vscode.window
            .showInformationMessage(
              "Headlamp folder not found. Do you want to clone the Headlamp repo?",
              "Yes",
              "No"
            )
            .then((selection) => {
              if (selection === "No") {
                vscode.window.showInformationMessage(
                  "No selected, not cloning. Please clone the Headlamp repo manually. Not running Headlamp."
                );
                return;
              }
              cloneAndRunHeadlamp();
            });
        } else {
          runHeadlamp();
        }
      }
    );

    context.subscriptions.push(disposable);
  }

  showReadme();
  addCreateNewPluginCommand();
  addRunHeadlampCommand();
}

// This method is called when your extension is deactivated
export function deactivate() {}
