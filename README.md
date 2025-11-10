![banner](./assets/banner.png)

# copy-paste-diff

**See exactly what changed when you paste.** Review pasted content with a side-by-side diff view before confirming changes.

## Demo

![Demo](./assets/clip-extension.gif)

## Quick Start

Press **Ctrl+Alt+V** (or **Cmd+Alt+V** on macOS) to paste with diff view. The extension shows a side-by-side comparison of your file before and after the paste.

## Features

- ✅ **Manual diff paste** - Press `Ctrl+Alt+V` / `Cmd+Alt+V` to paste and see changes
- ✅ **Smart detection** - Automatically skips diff when only whitespace/indentation changed
- ✅ **Native VS Code diff** - Uses built-in diff viewer with proper syntax highlighting
- ✅ **Optional auto mode** - Enable automatic diff for large pastes via `Ctrl+V` (see Settings)

## Settings

- **`diffPaste.enablePasteOverride`** (default: `false`)
  - Enable to automatically show diff when using normal Paste (`Ctrl+V`/`Cmd+V`) for large text blocks
  
- **`diffPaste.minPasteSize`** (default: `100`)
  - Minimum characters to trigger diff in automatic mode

## License

MIT © dev-jonathan

> repo: https://github.com/dev-jonathan/copy-paste-diff