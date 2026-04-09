# Data Model: Send Page to Google Tasks

**Date**: 2025-11-25
**Branch**: `001-send-page-to-gtask`

## Overview

This document defines the data structures used by the send-to-gtask Chrome Extension. The extension operates primarily as a pass-through to Google Tasks API, with minimal local storage for user preferences and cached data.

## Entities

### 1. Task (Google Tasks API)

Represents a task in Google Tasks. This entity is managed by Google; we only create instances.

**Source**: Google Tasks API response

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | string | Read-only, assigned by Google | Unique task identifier |
| title | string | Max 1024 chars, required | Task name (page title) |
| notes | string | Max 8192 chars, optional | Task details (page URL) |
| status | enum | "needsAction" \| "completed" | Task completion status |
| due | string (RFC 3339) | Optional, date only | Due date (not used in MVP) |
| updated | string (RFC 3339) | Read-only | Last modification time |

**Creation Payload** (what we send):
```typescript
interface TaskCreateRequest {
  title: string    // Page title, truncated to 1024 chars
  notes: string    // Page URL
}
```

**Validation Rules**:
- Title must not be empty (use URL domain as fallback)
- Title truncated at 1024 characters if longer
- Notes (URL) should be valid URL format
- URL is not truncated (8192 char limit is sufficient for any URL)

---

### 2. TaskList (Google Tasks API)

Represents a task list in Google Tasks. We read these to present options to users.

**Source**: Google Tasks API response

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | string | Read-only | Unique list identifier |
| title | string | Read-only | List display name |
| updated | string (RFC 3339) | Read-only | Last modification time |

**Special Value**: `@default` - Google's special identifier for the user's primary list.

---

### 3. UserPreferences (Local Storage)

User configuration stored in `chrome.storage.local`.

**Storage Key**: `preferences`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| selectedListId | string | "@default" | Target task list for new tasks |
| selectedListTitle | string | "My Tasks" | Display name of selected list (cached) |

**Validation Rules**:
- selectedListId must be a non-empty string
- If list no longer exists, reset to "@default"

**Storage Example**:
```json
{
  "preferences": {
    "selectedListId": "MTY4NDg0NzM2NzQ0ODYzNDI3ODc6MDow",
    "selectedListTitle": "Reading List"
  }
}
```

---

### 4. CachedTaskLists (Local Storage)

Cached list of user's task lists to reduce API calls.

**Storage Key**: `cachedLists`

| Field | Type | Description |
|-------|------|-------------|
| lists | TaskList[] | Array of task list objects |
| cachedAt | number | Unix timestamp (ms) of cache time |

**Cache Rules**:
- TTL: 5 minutes (300,000 ms)
- Invalidate on: manual refresh, list selection change error
- Max age check: `Date.now() - cachedAt > 300000`

**Storage Example**:
```json
{
  "cachedLists": {
    "lists": [
      { "id": "@default", "title": "My Tasks" },
      { "id": "abc123", "title": "Reading List" }
    ],
    "cachedAt": 1732550400000
  }
}
```

---

### 5. AuthState (Managed by Chrome)

Authentication state is managed by Chrome's identity API, not stored directly.

| Aspect | Management |
|--------|------------|
| Access Token | `chrome.identity.getAuthToken()` - cached by Chrome |
| Token Refresh | Automatic via Chrome identity API |
| Token Invalidation | `chrome.identity.removeCachedAuthToken()` |
| User Consent | Chrome's OAuth consent flow |

**Note**: We do NOT store tokens in `chrome.storage`. Chrome's identity API handles all token lifecycle.

---

## State Transitions

### Task Creation Flow

```
[User clicks icon]
    ↓
[Check auth state] → [Not authenticated] → [Prompt sign-in] → [Return to flow]
    ↓
[Authenticated]
    ↓
[Get current tab info]
    ↓
[Create task via API]
    ↓ (success)                    ↓ (401 error)
[Show confirmation]          [Invalidate token, retry once]
    ↓                              ↓
[Done]                        [Success or show error]
```

### List Selection Flow

```
[User opens settings]
    ↓
[Check cache validity]
    ↓ (valid)                  ↓ (invalid/missing)
[Use cached lists]         [Fetch from API]
    ↓                          ↓
[Display dropdown]         [Update cache, display]
    ↓
[User selects list]
    ↓
[Save to preferences]
    ↓
[Done]
```

---

## Storage Schema Summary

| Key | Type | Persistence | Purpose |
|-----|------|-------------|---------|
| `preferences` | UserPreferences | Persistent | User's selected task list |
| `cachedLists` | CachedTaskLists | Temporary (5 min TTL) | Reduce API calls |

**Total Storage Estimate**: <1KB typical usage

---

## Type Definitions (TypeScript)

```typescript
// Google Tasks API types
interface Task {
  id?: string
  title: string
  notes?: string
  status?: 'needsAction' | 'completed'
  due?: string
  updated?: string
}

interface TaskList {
  id: string
  title: string
  updated?: string
}

// Local storage types
interface UserPreferences {
  selectedListId: string
  selectedListTitle: string
}

interface CachedTaskLists {
  lists: TaskList[]
  cachedAt: number
}

// Storage schema
interface StorageSchema {
  preferences?: UserPreferences
  cachedLists?: CachedTaskLists
}
```
