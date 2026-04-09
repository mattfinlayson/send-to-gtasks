# API Contract: Chrome Extension APIs

**Date**: 2025-11-25
**Branch**: `001-send-page-to-gtask`

## Overview

This document specifies the Chrome Extension APIs used by send-to-gtask. All APIs are Manifest V3 compatible.

---

## 1. chrome.identity

Used for Google OAuth2 authentication.

### getAuthToken

Retrieves an OAuth2 access token for the configured scopes.

**Signature**:
```typescript
chrome.identity.getAuthToken(
  details: { interactive: boolean },
  callback: (token?: string) => void
): void
```

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| interactive | boolean | If true, shows consent UI if needed |

**Returns**: Access token string, or undefined if auth fails

**Usage**:
```typescript
// User-triggered (popup click)
chrome.identity.getAuthToken({ interactive: true }, (token) => {
  if (chrome.runtime.lastError) {
    // Handle error
    return
  }
  // Use token
})

// Background refresh (non-interactive)
chrome.identity.getAuthToken({ interactive: false }, (token) => {
  // May return undefined if user needs to re-consent
})
```

**Error Scenarios**:
| Error | Cause | Action |
|-------|-------|--------|
| "OAuth2 not granted or revoked" | User denied/revoked | Prompt sign-in again |
| "The user is not signed in" | No Chrome profile | Show sign-in instruction |

---

### removeCachedAuthToken

Removes a cached token, forcing a refresh on next getAuthToken call.

**Signature**:
```typescript
chrome.identity.removeCachedAuthToken(
  details: { token: string },
  callback?: () => void
): void
```

**Usage**:
```typescript
// Call when API returns 401
chrome.identity.removeCachedAuthToken({ token: expiredToken }, () => {
  // Now getAuthToken will fetch a fresh token
})
```

---

## 2. chrome.tabs

Used to get current page information.

### query

Queries for tabs matching specified criteria.

**Signature**:
```typescript
chrome.tabs.query(
  queryInfo: { active?: boolean, currentWindow?: boolean },
  callback: (tabs: Tab[]) => void
): void
```

**Usage for Current Tab**:
```typescript
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0]
  const url = tab.url      // Full URL
  const title = tab.title  // Page title
})
```

**Tab Object Fields Used**:
| Field | Type | Description |
|-------|------|-------------|
| url | string | Full page URL |
| title | string | Page title (may be empty) |
| id | number | Tab identifier |

**Note**: Requires `activeTab` permission to access URL/title.

---

## 3. chrome.storage.local

Persistent local storage for extension data.

### get

Retrieves items from storage.

**Signature**:
```typescript
chrome.storage.local.get(
  keys: string | string[] | null,
  callback: (items: { [key: string]: any }) => void
): void
```

**Usage**:
```typescript
// Get specific keys
chrome.storage.local.get(['preferences', 'cachedLists'], (result) => {
  const prefs = result.preferences
  const lists = result.cachedLists
})

// Get all data
chrome.storage.local.get(null, (result) => {
  // result contains all stored data
})
```

---

### set

Saves items to storage.

**Signature**:
```typescript
chrome.storage.local.set(
  items: { [key: string]: any },
  callback?: () => void
): void
```

**Usage**:
```typescript
chrome.storage.local.set({
  preferences: {
    selectedListId: '@default',
    selectedListTitle: 'My Tasks'
  }
}, () => {
  // Saved
})
```

---

### remove

Removes items from storage.

**Signature**:
```typescript
chrome.storage.local.remove(
  keys: string | string[],
  callback?: () => void
): void
```

**Usage**:
```typescript
// Clear cache
chrome.storage.local.remove('cachedLists', () => {
  // Cache cleared
})
```

---

## 4. chrome.action (Manifest V3)

Controls the extension toolbar icon.

### setIcon

Sets the icon image.

**Signature**:
```typescript
chrome.action.setIcon(
  details: { path: string | { [size: number]: string }, tabId?: number },
  callback?: () => void
): void
```

**Usage**:
```typescript
// Set disabled state
chrome.action.setIcon({
  path: 'icons/icon-disabled.png',
  tabId: tab.id
})

// Set success state
chrome.action.setIcon({
  path: 'icons/icon-success.png',
  tabId: tab.id
})
```

---

### setBadgeText

Sets badge text on the icon.

**Signature**:
```typescript
chrome.action.setBadgeText(
  details: { text: string, tabId?: number },
  callback?: () => void
): void
```

**Usage**:
```typescript
// Show success indicator
chrome.action.setBadgeText({ text: '✓', tabId: tab.id })

// Clear badge
chrome.action.setBadgeText({ text: '', tabId: tab.id })
```

---

### setBadgeBackgroundColor

Sets badge background color.

**Usage**:
```typescript
chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' }) // Green for success
chrome.action.setBadgeBackgroundColor({ color: '#F44336' }) // Red for error
```

---

## Required Permissions

**manifest.json**:
```json
{
  "permissions": [
    "activeTab",
    "storage",
    "identity"
  ],
  "oauth2": {
    "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
    "scopes": ["https://www.googleapis.com/auth/tasks"]
  }
}
```

| Permission | Purpose | User Impact |
|------------|---------|-------------|
| activeTab | Access current tab URL/title | Only when user clicks icon |
| storage | Save preferences | No prompt needed |
| identity | Google OAuth | Prompts for Google sign-in |

---

## TypeScript Type Definitions

```typescript
// Chrome API types (subset used)
declare namespace chrome {
  namespace identity {
    function getAuthToken(
      details: { interactive: boolean },
      callback: (token?: string) => void
    ): void

    function removeCachedAuthToken(
      details: { token: string },
      callback?: () => void
    ): void
  }

  namespace tabs {
    interface Tab {
      id?: number
      url?: string
      title?: string
    }

    function query(
      queryInfo: { active?: boolean; currentWindow?: boolean },
      callback: (result: Tab[]) => void
    ): void
  }

  namespace storage {
    namespace local {
      function get(
        keys: string | string[] | null,
        callback: (items: { [key: string]: any }) => void
      ): void

      function set(
        items: { [key: string]: any },
        callback?: () => void
      ): void

      function remove(
        keys: string | string[],
        callback?: () => void
      ): void
    }
  }

  namespace action {
    function setIcon(
      details: { path: string; tabId?: number },
      callback?: () => void
    ): void

    function setBadgeText(
      details: { text: string; tabId?: number },
      callback?: () => void
    ): void

    function setBadgeBackgroundColor(
      details: { color: string },
      callback?: () => void
    ): void
  }

  namespace runtime {
    const lastError: { message?: string } | undefined
  }
}
```
