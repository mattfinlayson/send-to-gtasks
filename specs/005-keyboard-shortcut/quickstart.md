# Quickstart: Keyboard Shortcut Feature

## Overview

Add keyboard shortcut support to allow power users to quickly save the current page as a task using `Ctrl+Shift+T`.

## Key Technologies

- **Chrome Command API** — Native shortcut registration and conflict detection
- **chrome.storage.local** — Persist custom shortcut preferences
- **chrome.storage.session** — Per-session quick-save toggle
- **chrome.commands.onCommand** — Handle shortcut trigger

## Implementation Steps

### 1. Update manifest.json

Add command definition:

```json
{
  "commands": {
    "_execute_action": {
      "suggested_key": {
        "default": "Ctrl+Shift+T",
        "mac": "Command+Shift+T"
      },
      "description": "Save current page as task"
    }
  }
}
```

### 2. Handle Command Event

In background script, listen for command events:

```typescript
chrome.commands.onCommand.addListener((command) => {
  if (command === "_execute_action") {
    handleShortcutTrigger();
  }
});
```

### 3. Add Options UI

In options page:
- Shortcut display/input field
- Quick save toggle checkbox
- Save/Reset buttons

### 4. Quick Save Toast

For quick-save mode, show toast popup that auto-closes:
- Create minimal toast popup
- Auto-close after 2 seconds

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/manifest.json` | Add command definition |
| `src/background/shortcut-handler.ts` | New: Handle command events |
| `src/options/options.ts` | Add shortcut settings UI |
| `src/popup/toast.ts` | New: Quick save toast popup |
| `src/types/shortcut.ts` | New: Type definitions |
| `tests/unit/shortcut.test.ts` | New: Unit tests |

## Testing

1. Press `Ctrl+Shift+T` → popup opens with page title/URL
2. Enable quick save in options → press shortcut → toast appears
3. Change shortcut in options → new shortcut triggers action
4. Try invalid shortcut → error shown
5. Try conflicting shortcut → conflict warning shown
