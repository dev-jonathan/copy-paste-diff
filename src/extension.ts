import * as vscode from "vscode";
import * as path from "path";

// Global state to store the document content before the paste operation.
let lastOriginalText: string = "";
let lastDocUri: vscode.Uri | undefined;

// It provides the original text for the left side of the diff view.
const provider: vscode.TextDocumentContentProvider = {
  provideTextDocumentContent(_uri: vscode.Uri): string {
    return lastOriginalText; // Return the saved pre-paste content.
  },
};

export function activate(context: vscode.ExtensionContext) {
  // Register the content provider.
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider("diff-paste", provider)
  );

  // 1) Command: autoDiffPaste (executed automatically, e.g., on Ctrl+V override)
  const autoDiffPasteCommand = vscode.commands.registerCommand(
    "diffPaste.autoDiffPaste",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        // No active editor: perform default paste.
        return vscode.commands.executeCommand(
          "editor.action.clipboardPasteAction"
        );
      }

      const doc = editor.document;
      const config = vscode.workspace.getConfiguration("diffPaste");
      const minSize = config.get<number>("minPasteSize", 100);
      const clipText = await vscode.env.clipboard.readText();

      // Calculate the length of the selected text being replaced.
      const replacedLen = editor.selections.reduce(
        (sum, sel) => sum + doc.getText(sel).length,
        0
      );

      // Early exit: If both pasted text and replaced text are small, use normal paste.
      if (clipText.length < minSize && replacedLen < minSize) {
        return vscode.commands.executeCommand(
          "editor.action.clipboardPasteAction"
        );
      }

      // Paste is large enough: trigger the forced diff paste logic.
      await vscode.commands.executeCommand("diffPaste.forceDiffPaste");
    }
  );

  // 2) Command: forceDiffPaste (triggered by autoDiffPaste or a dedicated shortcut)
  const forceDiffPasteCommand = vscode.commands.registerCommand(
    "diffPaste.forceDiffPaste",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        // No active editor: perform default paste.
        return vscode.commands.executeCommand(
          "editor.action.clipboardPasteAction"
        );
      }

      const doc = editor.document;

      // STEP 1: Capture current content (BEFORE paste).
      lastOriginalText = doc.getText();
      lastDocUri = doc.uri;

      // STEP 2: Execute the real paste operation.
      await vscode.commands.executeCommand(
        "editor.action.clipboardPasteAction"
      );

      // STEP 3: Check if the content changed meaningfully (ignoring whitespace).
      const newText = doc.getText();
      if (textChangedMeaningfully(lastOriginalText, newText)) {
        // STEP 4: Show the diff view.
        await showDiff(doc);
      } else {
        // Only whitespace/indentation changed: clear state and notify.
        lastOriginalText = "";
        lastDocUri = undefined;
        vscode.window.showInformationMessage(
          "Diff Paste: Only whitespace/indentation changed."
        );
      }
    }
  );

  context.subscriptions.push(autoDiffPasteCommand, forceDiffPasteCommand);
}

// Helper function to open the VS Code Diff view.
async function showDiff(doc: vscode.TextDocument) {
  const ext = path.extname(doc.uri.fsPath) || ".txt";
  const virtUri = vscode.Uri.parse(`diff-paste://diff/original${ext}`);
  const baseName = path.basename(doc.uri.fsPath, ext);
  const title = `Diff (Paste) - ${baseName}`;

  await vscode.commands.executeCommand("vscode.diff", virtUri, doc.uri, title, {
    preview: false,
  });
}

// Checks if the content change is meaningful (i.e., not just whitespace/indentation).
function textChangedMeaningfully(oldText: string, newText: string): boolean {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");

  if (oldLines.length !== newLines.length) {
    return true;
  }

  for (let i = 0; i < oldLines.length; i++) {
    if (oldLines[i].trim() !== newLines[i].trim()) {
      return true; // Content differs ignoring surrounding whitespace.
    }
  }

  return false; // No meaningful change found.
}

export function deactivate() {
  // Clear global state on extension deactivation.
  lastOriginalText = "";
  lastDocUri = undefined;
}
