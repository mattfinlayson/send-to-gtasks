# Data Model: Keyboard Shortcut Feature

## Entities

### ShortcutPreference

Stores the user's keyboard shortcut configuration.

| Field | Type | Constraints | Notes |
|-------|------|------------|-------|
| `shortcut_key` | `string` | Non-empty, valid Chrome shortcut format | e.g., "Ctrl+Shift+K" |
| `is_default` | `boolean` | — | `true` if using manifest default |
| `quick_save_enabled` | `boolean` | — | `false` by default (shows popup) |
| `last_modified` | `number` | Unix timestamp | Auto-updated on change |

### Task (Existing)

Represents a task to be sent to Google Tasks. Refer to existing implementation.

---

## State Transitions

### ShortcutPreference Lifecycle

```
[Default State]
    ↓ (User opens options page)
[Editing State]
    ↓ (User saves new shortcut)
[Validating State] → Invalid → [Show error, return to Editing]
    ↓ (Valid)
[Persisted State]
    ↓ (User clicks "Reset to Default")
[Default State]
```

---

## Storage Strategy

| Field | Storage | Rationale |
|-------|---------|-----------|
| `shortcut_key` | `chrome.storage.local` | Custom shortcuts must persist across sessions |
| `is_default` | Derived from `shortcut_key === DEFAULT_KEY` | No separate storage needed |
| `quick_save_enabled` | `chrome.storage.session` | Per-session preference, no need to persist |

---

## Chrome Command Configuration

Commands are defined in `manifest.json` and registered with Chrome:

```json
{
  "commands": {
    "_execute_action": {
      "suggested_key": {
        "default": "Ctrl+Shift+K",
        "mac": "Command+Shift+T"
      },
      "description": "Save current page as task"
    }
  }
}
```

### Command Names

| Command | Purpose |
|---------|---------|
| `_execute_action` | Triggers the extension action (opens popup) |

---

## Validation Rules

1. **Shortcut must not be empty**
2. **Shortcut must be a valid Chrome shortcut format** (e.g., "Ctrl+Shift+K")
3. **Shortcut must not conflict with Chrome built-in shortcuts**
   - Chrome provides `commands.update()` with conflict detection
   - Conflicts reported via `commands.onChanged` event
