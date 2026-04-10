# Research: Enhance Task Saving

## Research Summary

This feature requires research on: Chrome Extension notifications, offline storage patterns, Google Tasks API notes/due date support, and CSS dark mode.

---

## Chrome Extension Offline Queue Patterns

### Decision
Use `chrome.storage.local` for offline queue with `chrome.alarms` for retry scheduling.

### Rationale
- `chrome.storage.local` persists across sessions (unlike `session` storage)
- `chrome.alarms.create()` survives service worker restarts
- Alarms are the MV3-compliant way to run periodic tasks (not `setInterval`)

### Alternatives Considered
- **IndexedDB**: Overkill for simple queue, adds complexity
- **Background sync API**: Not available in MV3 service workers
- **setInterval**: Service workers terminate, not reliable

### Implementation Pattern
```typescript
// Queue structure
interface QueuedTask {
  id: string;
  title: string;
  url: string;
  notes?: string;
  dueDate?: string; // ISO date
  createdAt: number;
  retryCount: number;
  status: 'pending' | 'failed';
}

// Use alarms for retry
chrome.alarms.create('syncOfflineQueue', { periodInMinutes: 1 });
```

---

## Google Tasks API Notes & Due Date

### Decision
Notes field: Use Google Tasks `notes` property (max 1024 chars).  
Due date field: Use Google Tasks `due` property (RFC 3339 format).

### API Details
```
PATCH https://tasks.googleapis.com/tasks/v1/lists/{taskListId}/tasks/{taskId}
{
  "notes": "User annotation...",
  "due": "2026-04-15T00:00:00.000Z"
}
```

### Validation
- Notes: Truncate to 1024 chars before API call
- Due date: Validate within reasonable range (today to +5 years)

---

## Notification Patterns (MV3)

### Decision
Use toast notifications via auto-closing popup (existing toast.ts pattern).

### Rationale
- Chrome Web Store requires `"notification"` permission for `chrome.notifications`
- Toast popup is simpler and consistent with existing UX
- Popup auto-close after 2s matches spec requirements

### Notification Types
- **Success**: Green icon, task title, 2s duration
- **Error**: Red icon, error message, manual close option
- **Queued**: Yellow icon, "Task queued for sync" message

---

## Dark Mode Implementation

### Decision
Use CSS `prefers-color-scheme` media query with CSS custom properties.

### Rationale
- System-following per spec requirement
- CSS-only solution (no JavaScript needed)
- No additional permissions required

### Implementation Pattern
```css
:root {
  --bg-primary: #ffffff;
  --text-primary: #1a1a1a;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #1a1a1a;
    --text-primary: #ffffff;
  }
}
```

---

## Duplicate Detection Strategy

### Decision
Query Google Tasks API before save to check URL existence.

### Rationale
- URL stored in task notes field with marker: `[Saved from: https://...]`
- Parse notes field for URL match
- Check both synced tasks and pending queue

### API Query Pattern
```typescript
// List tasks, check notes for URL match
const response = await tasksApi.tasks.list({ tasklist: taskListId });
const tasks = response.data.items || [];
const isDuplicate = tasks.some(task => 
  task.notes?.includes(`[Saved from: ${url}]`)
);
```

---

## Edge Case Resolutions

| Edge Case | Resolution |
|-----------|------------|
| Note exceeds 1024 chars | Truncate with "... (truncated)" suffix |
| Due date > 5 years | Show warning, cap at 5 years |
| Connectivity lost mid-sync | Each task retried independently; continue with others |
| Storage cleared mid-queue | Lost permanently; show notification on next open |
| High-contrast themes | Rely on system; CSS respects `forced-colors` |
