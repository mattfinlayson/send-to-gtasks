# Project Agent Definitions

This project is a Chrome Extension (Manifest V3) for sending tasks to Google Tasks.

## Stack

- **TypeScript 5.9+** with strict mode
- **Chrome Extension APIs** via `@types/chrome`
- **Google Tasks REST API** for task creation
- **Vite 5.x + esbuild** for builds
- **Vitest 1.x** for testing
- **Biome 2.x** for linting/formatting

## Commands

- `npm run check` — quality gate (Biome lint/format, TypeScript check)

## Gotchas

### Service Worker (MV3)

- Service workers are **ephemeral** — they terminate after ~30s of inactivity. Never store state in module-level variables; use `chrome.storage.session` or `chrome.storage.local`.
- **Never use `localStorage`** in service workers (no DOM access).
- **Never use `setInterval`** for periodic tasks — use `chrome.alarms.create()` + `chrome.alarms.onAlarm`. This includes badge clearing.
- Need DOM access (audio, canvas, clipboard)? Use **offscreen documents** via `chrome.offscreen.createDocument()`.
- No `eval()` or `new Function()` — blocked by MV3 CSP.

### Storage

| Storage | Use for |
|---------|---------|
| `chrome.storage.session` | Ephemeral state cleared on browser restart |
| `chrome.storage.local` | Persistent data, cached lists, device-specific state |
| `chrome.storage.sync` | User preferences synced across devices (100KB limit) |

### Popup

- Popup DOM is **destroyed on close** — don't store state there. Use `chrome.storage.session` to persist popup state.

### Content Scripts

- Run in **ISOLATED world** by default — cannot access page JS variables. Use MAIN world only when you must intercept page JS.
- Use `chrome.scripting.executeScript()` (MV3) not `chrome.tabs.executeScript()` (MV2).
- Scope CSS with unique prefixes or Shadow DOM to avoid conflicts with host page styles.

### Messaging

- Use `chrome.runtime.sendMessage` for extension-internal messaging.
- **Always validate `sender.id`** in `onMessage` listeners to prevent cross-extension attacks.
- Use `window.postMessage` only for MAIN world communication with page scripts.

### Permissions

- Prefer `activeTab` over broad host permissions.
- Use `chrome.permissions.request()` for optional permissions users opt into.
- Every new permission triggers user re-approval on update — minimize required permissions.

### MV2 → MV3 Migration Notes

If working on legacy patterns:

- `chrome.tabs.executeScript` → `chrome.scripting.executeScript`
- `setTimeout`/`setInterval` in background → `chrome.alarms`
- Blocking `webRequest` → `chrome.declarativeNetRequest`
- `browser_action`/`page_action` → unified `action`
- Host permissions in `permissions` array → move to `host_permissions` array
