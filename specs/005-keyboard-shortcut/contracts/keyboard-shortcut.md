# Contracts: Keyboard Shortcut Feature

## Chrome Extension Interface Contracts

### Command Contract

**Trigger**: User presses configured keyboard shortcut

```typescript
// Command event fired by Chrome
interface CommandEvent {
  name: "_execute_action";
}

// Extension must handle this in background script
chrome.commands.onCommand.addListener((command: string) => {
  // command === "_execute_action"
});
```

### Storage Contract

**Shortcut Preference Storage**:

```typescript
interface ShortcutPreference {
  shortcut_key: string;      // e.g., "Ctrl+Shift+K"
  quick_save_enabled: boolean; // false = show popup
}
```

**Storage Keys**:
- `chrome.storage.local["shortcut_key"]` — persists across sessions
- `chrome.storage.session["quick_save_enabled"]` — per-session

### Options Page Contract

**Settings Interface**:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `shortcut_key` | text input | "Ctrl+Shift+K" | Current shortcut |
| `quick_save_enabled` | checkbox | false | Skip popup on shortcut |

**Actions**:
| Action | Trigger | Effect |
|--------|---------|--------|
| Save | Click "Save" | Validates and persists shortcut |
| Reset | Click "Reset to Default" | Restores "Ctrl+Shift+K" |

### Quick Save Toast Contract

**Trigger**: Shortcut pressed with `quick_save_enabled === true`

**Contract**:

```typescript
interface QuickSaveToast {
  visible: boolean;     // true during display
  message: string;       // e.g., "Task created: {title}"
  duration: 2000;        // auto-close after 2s (ms)
}
```

**Lifecycle**:
1. Toast appears with task title
2. After 2000ms, toast disappears
3. No further action required from user

---

## User-Facing Messages

| Scenario | Message |
|----------|---------|
| Quick save success | "Task created: {page title}" |
| Quick save error | "Failed to create task. Check your connection." |
| Invalid shortcut | "Invalid shortcut. Use format: Ctrl+Shift+K" |
| Conflict detected | "This shortcut conflicts with Chrome. Choose another." |
