# Data Model: Code Review Fixes

**Feature**: 002-code-review-fixes
**Date**: 2026-04-08

This feature does not introduce new stored entities. It makes targeted changes to the existing type system to fix runtime bugs and improve type safety.

---

## Changed Types

### `AppError.code` — Add `PERMISSION_DENIED`

**File**: `src/types/index.ts`

**Current**:
```typescript
code: 'AUTH_REQUIRED' | 'AUTH_FAILED' | 'NETWORK_ERROR' | 'API_ERROR' | 'RATE_LIMITED' | 'LIST_NOT_FOUND' | 'UNKNOWN'
```

**New**:
```typescript
code: 'AUTH_REQUIRED' | 'AUTH_FAILED' | 'PERMISSION_DENIED' | 'NETWORK_ERROR' | 'API_ERROR' | 'RATE_LIMITED' | 'LIST_NOT_FOUND' | 'UNKNOWN'
```

**Reason**: HTTP 403 (forbidden/insufficient scope) is now distinguished from HTTP 429 (rate limited). `PERMISSION_DENIED` is the new code for 403 responses.

---

## New Types

### `ExtensionMessage` — Discriminated Union for Runtime Messages

**File**: `src/types/index.ts`

```typescript
export type ExtensionMessage =
  | { type: 'TASK_CREATED'; tabId?: number }
  | { type: 'TASK_ERROR'; tabId?: number }
```

**Purpose**: Replaces untyped `message: any` in `chrome.runtime.onMessage` listener and untyped `sendMessage` call in `popup.ts`. Ensures both sides of the message channel are type-safe.

**Used by**:
- `src/background/service-worker.ts` — message listener parameter
- `src/popup/popup.ts` — `notifyServiceWorker()` argument

---

### `isAppError` — Type Predicate

**File**: `src/types/index.ts`

```typescript
export function isAppError(e: unknown): e is AppError {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    'retryable' in e &&
    typeof (e as Record<string, unknown>).code === 'string'
  )
}
```

**Purpose**: Replaces duplicated duck-typing in `popup.ts` and `options.ts`. Exported from `types/index.ts` for shared use.

---

## Unchanged Storage Schema

`chrome.storage.local` stores:
- `preferences: UserPreferences` — `{ selectedListId: string, selectedListTitle: string }`
- `cachedLists: CachedTaskLists` — `{ lists: TaskList[], cachedAt: number }`

No schema changes in this feature. The `chrome.storage.session` key `pendingBadgeClear` used by the service worker is ephemeral (session-scoped) and not part of the persisted schema.

### `pendingBadgeClear` — Session Storage Entry (Service Worker)

**Storage**: `chrome.storage.session` (ephemeral, cleared on browser restart)

```typescript
interface PendingBadgeClear {
  tabId?: number
}
```

**Lifecycle**:
1. Written by `showSuccessBadge` / `showErrorBadge` when setting the badge
2. Read and deleted by the `chrome.alarms.onAlarm` handler (`'clear-badge'` alarm)

---

## Dead Types to Remove

The following types are defined in `src/types/index.ts` but never imported or used in source files. They will be removed:

| Type | Reason for removal |
|---|---|
| `Task` | Superseded by `TaskResponse` and `TaskCreateRequest`; never used in source |
| `StorageSchema` | Never imported; storage accessed directly via typed functions |
| `GoogleAPIError` | Defined for response body parsing that was never implemented |

**Note**: `TaskListResponse` and `MAX_NOTES_LENGTH` are NOT removed:
- `TaskListResponse` is used in `TaskListsResponse.items` and in test fixtures (fix tests to use it correctly)
- `MAX_NOTES_LENGTH` is used in the new URL truncation validation

`isAuthenticated()` in `auth.ts` is called only from tests. It is retained but not exported as a production API surface (keep for testability).
