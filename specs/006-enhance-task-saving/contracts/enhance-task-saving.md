# Contracts: Enhance Task Saving

## Popup UI Contract

### Task Save Form

```typescript
interface TaskSaveForm {
  title: string;      // Required, from page title
  url: string;        // Required, from page URL
  notes: string;      // Optional, max 1024 chars
  dueDate: string;    // Optional, ISO date YYYY-MM-DD
  taskListId: string; // Required, selected list
}
```

### Save Button States

| State | Condition | Behavior |
|-------|-----------|----------|
| `idle` | Default | "Save Task" enabled |
| `loading` | Saving in progress | Spinner, disabled |
| `success` | Save succeeded | Toast shown, form reset |
| `error` | Save failed | Error toast with retry |
| `queued` | Offline mode | "Queued for sync" toast |
| `duplicate` | URL exists | Warning dialog shown |

### Due Date Picker

```typescript
interface DueDateConstraints {
  min: string;  // "2026-04-09" (today)
  max: string;  // "2031-04-09" (+5 years)
}
```

---

## Notification Contract

### Toast Messages

| Type | Icon | Duration | Actions |
|------|------|----------|---------|
| `success` | ✓ green | 2000ms | None |
| `error` | ✗ red | Manual | "Retry" button |
| `queued` | ⏳ yellow | 3000ms | None |
| `duplicate` | ⚠ yellow | Manual | "Save Anyway", "Cancel" |

### Toast Payload

```typescript
interface ToastNotification {
  type: 'success' | 'error' | 'queued' | 'duplicate';
  title: string;      // Primary text
  message?: string;  // Secondary text
  duration?: number;  // Override default duration
  actions?: ToastAction[];
}

interface ToastAction {
  label: string;
  onClick: () => void;
}
```

---

## Offline Queue Contract

### Queue Entry

```typescript
interface OfflineQueueEntry {
  id: string;
  task: TaskSaveForm;
  createdAt: number;    // Unix ms
  lastRetryAt: number;  // Unix ms
  retryCount: number;   // 0-3
  status: 'pending' | 'syncing' | 'failed';
}
```

### Queue Operations

```typescript
interface OfflineQueueAPI {
  // Add task to queue
  enqueue(task: TaskSaveForm): Promise<string>; // returns queue ID
  
  // Get all pending tasks
  getPending(): Promise<OfflineQueueEntry[]>;
  
  // Update task status
  updateStatus(id: string, status: 'pending' | 'syncing' | 'failed'): Promise<void>;
  
  // Remove task (after successful sync)
  dequeue(id: string): Promise<void>;
  
  // Get queue statistics
  getStats(): Promise<{ pending: number; failed: number }>;
  
  // Cleanup expired tasks (>24h since createdAt)
  cleanup(): Promise<number>; // returns count removed
}
```

---

## Duplicate Detection Contract

### Detection Request

```typescript
interface DuplicateCheck {
  url: string;
  includeQueue: boolean; // Check pending queue too
}
```

### Detection Response

```typescript
interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingTaskUrl?: string; // If duplicate, URL of existing task
  matchedIn: 'synced' | 'queue' | 'both';
}
```

---

## Storage Keys

| Key | Type | Persistence |
|-----|------|-------------|
| `offlineQueue` | `OfflineQueue` | Session + restart |
| `savedUrlIndex` | `SavedUrlIndex` | Permanent |
| `preferences.darkMode` | `'system' \| 'light' \| 'dark'` | Permanent |
