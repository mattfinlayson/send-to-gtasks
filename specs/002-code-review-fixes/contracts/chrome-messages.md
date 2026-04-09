# Contract: Chrome Extension Message Passing

**Feature**: 002-code-review-fixes
**Date**: 2026-04-08

This document defines the internal message contract between the popup context and the background service worker.

---

## Message Types

### `TASK_CREATED`

Sent by `popup.ts` to the service worker after a task is successfully created.

```typescript
{
  type: 'TASK_CREATED'
  tabId?: number   // The tab ID of the active tab at time of creation (optional)
}
```

**Service worker response**:
```typescript
{ success: true }
```

**Side effects**: Service worker displays the success badge (✓, green) on the extension icon.

---

### `TASK_ERROR`

Sent by `popup.ts` to the service worker after a task creation failure.

```typescript
{
  type: 'TASK_ERROR'
  tabId?: number   // The tab ID of the active tab at time of failure (optional)
}
```

**Service worker response**:
```typescript
{ success: true }
```

**Side effects**: Service worker displays the error badge (!, red) on the extension icon.

---

## Contract Validation

Both sender and receiver must narrow to `ExtensionMessage` before accessing `type` or `tabId`:

```typescript
// In popup.ts (sender)
function notifyServiceWorker(type: ExtensionMessage['type']): void {
  const message: ExtensionMessage = { type }
  chrome.runtime.sendMessage(message).catch(() => {
    // Service worker may be inactive; badge update is best-effort
  })
}

// In service-worker.ts (receiver)
chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, sender, sendResponse) => {
    if (sender.id !== chrome.runtime.id) return false
    // ...
  }
)
```

---

## Alarm Contract

The service worker uses `chrome.alarms` to clear badges durably.

**Alarm name**: `'clear-badge'`

**Trigger**: Created in `showSuccessBadge` and `showErrorBadge` after badge is set.

**Session storage key**: `'pendingBadgeClear'` (`chrome.storage.session`)

```typescript
// Written before alarm creation
chrome.storage.session.set({ pendingBadgeClear: { tabId } })

// Read in alarm listener
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'clear-badge') {
    const result = await chrome.storage.session.get(['pendingBadgeClear'])
    const { tabId } = result.pendingBadgeClear ?? {}
    const clearOptions: chrome.action.SetBadgeTextDetails = { text: '' }
    if (tabId) clearOptions.tabId = tabId
    chrome.action.setBadgeText(clearOptions)
    chrome.storage.session.remove('pendingBadgeClear')
  }
})
```

**Production note**: Chrome clamps alarm delays below 1 minute to 1 minute for packed extensions. The badge may persist for up to 1 minute in production if the service worker is terminated between badge set and badge clear. This is a cosmetic limitation.
