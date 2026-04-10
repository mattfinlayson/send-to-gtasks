# Data Model: Enhance Task Saving

## Entities

### QueuedTask

Persisted in `chrome.storage.local` under key `offlineQueue`.

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| `id` | `string` | UUID v4 | Unique identifier for the queued task |
| `title` | `string` | Non-empty, max 500 chars | Task title |
| `url` | `string` | Valid URL format | Source page URL |
| `notes` | `string` | Max 1024 chars | User note (optional) |
| `dueDate` | `string` | ISO date, today to +5 years | Due date (optional) |
| `taskListId` | `string` | Non-empty | Target Google Tasks list |
| `createdAt` | `number` | Unix timestamp | When task was queued |
| `lastRetryAt` | `number` | Unix timestamp | Last sync attempt |
| `retryCount` | `number` | 0-3 | Number of retry attempts |
| `status` | `enum` | `pending`, `syncing`, `failed` | Current sync status |

**State Transitions:**
```
created → pending → syncing → synced
                    ↓
                  failed (if retryCount >= 3 and 24h elapsed)
```

### OfflineQueue

Container for queued tasks.

| Field | Type | Description |
|-------|------|-------------|
| `tasks` | `QueuedTask[]` | Array of queued tasks |
| `lastSyncAt` | `number` | Unix timestamp of last sync attempt |

**Storage Key:** `offlineQueue` in `chrome.storage.local`

### SavedUrlIndex

Index for duplicate detection.

| Field | Type | Description |
|-------|------|-------------|
| `urls` | `string[]` | Set of saved URLs (normalized) |
| `lastUpdated` | `number` | Unix timestamp |

**Storage Key:** `savedUrlIndex` in `chrome.storage.local`

**Note:** URLs are stored with trailing slash normalized.

### NotificationConfig

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `successDurationMs` | `number` | 2000 | Toast auto-close duration |
| `errorDurationMs` | `number` | 0 | Error toast (manual close) |
| `queuedDurationMs` | `number` | 3000 | Queued notification duration |

---

## UI Contracts

### Popup Notes Field

| Property | Value |
|----------|-------|
| Element ID | `notes-input` |
| Type | `textarea` |
| Max length | 1024 characters |
| Placeholder | "Add notes..." |
| Visibility | Popup mode only |

### Popup Due Date Picker

| Property | Value |
|----------|-------|
| Element ID | `due-date-picker` |
| Type | `input[type="date"]` |
| Min date | Today |
| Max date | +5 years |
| Visibility | Popup mode only |

### Duplicate Warning Dialog

| Property | Value |
|----------|-------|
| Element ID | `duplicate-warning` |
| Actions | "Save Anyway", "Cancel" |
| Modal | Yes, overlay |

---

## Storage Layout

```
chrome.storage.local
├── preferences        # Existing
├── cachedLists        # Existing  
├── shortcutPreference # Existing
├── offlineQueue       # NEW: { tasks: QueuedTask[], lastSyncAt: number }
└── savedUrlIndex      # NEW: { urls: string[], lastUpdated: number }
```

---

## Migrations

No migrations required for initial feature. Future versions may need:
- Version field in storage to handle schema changes
- Cleanup of stale queued tasks (>24h)
