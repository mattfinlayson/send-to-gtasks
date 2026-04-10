# Quickstart: Enhance Task Saving

## New Features Overview

This update adds 6 enhancements to task saving:

| Feature | Description |
|---------|-------------|
| **Notes** | Add annotations to saved tasks |
| **Due Dates** | Set completion dates for tasks |
| **Better Notifications** | Clear success/error feedback |
| **Offline Queue** | Queue tasks when offline |
| **Duplicate Detection** | Warn on repeated URLs |
| **Dark Mode** | System-following dark theme |

---

## Files to Modify

### Popup UI (`src/popup/`)

| File | Changes |
|------|---------|
| `popup.html` | Add notes textarea, due date picker |
| `popup.ts` | Handle new form fields, validation |
| `popup.css` | Add dark mode styles |

### Storage (`src/services/storage.ts`)

| Function | Changes |
|----------|---------|
| `getPreferences()` | Return dark mode preference |
| `setPreferences()` | Save dark mode preference |
| New: `getOfflineQueue()` | Retrieve queued tasks |
| New: `enqueueTask()` | Add task to offline queue |
| New: `getSavedUrls()` | Get URL index for duplicates |

### Task Creation (`src/services/task-creation.ts`)

| Function | Changes |
|----------|---------|
| `createTask()` | Add notes and due date to API call |
| New: `syncOfflineQueue()` | Process queued tasks |
| New: `checkDuplicate()` | Check if URL exists |

### Service Worker (`src/background/service-worker.ts`)

| Addition | Purpose |
|----------|---------|
| Alarm listener | Trigger queue sync periodically |
| `onInstalled` | Initialize storage, cleanup old queue |

### Options Page (`src/options/`)

| File | Changes |
|------|---------|
| `options.html` | Add dark mode toggle (if manual override) |
| `options.ts` | Persist preference |
| `options.css` | Add dark mode styles |

---

## Testing Checklist

- [ ] Save task with notes → notes appear in Google Tasks
- [ ] Save task with due date → date set in Google Tasks
- [ ] Success toast shows within 2s
- [ ] Error toast shows with retry option
- [ ] Save offline → task queued, notification shown
- [ ] Go online → queued tasks sync automatically
- [ ] Save duplicate URL → warning dialog appears
- [ ] Dark mode → popup/options respect system preference

---

## Key Dependencies

- `chrome.alarms` for offline queue sync
- `chrome.storage.local` for persistence
- `prefers-color-scheme` CSS media query
- Google Tasks API `notes` and `due` fields
