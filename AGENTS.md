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
- `npm run build` — production build with Vite
- `npm run zip` — create distributable ZIP for Chrome Web Store
- `npm run test` — run Vitest tests
- `npm run type-check` — TypeScript type checking
- `npm run lint` — Biome linting

## GitHub Actions

### Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | PR to `main` | Lint, type-check, tests |
| `release.yml` | Release published | Build, zip, upload artifact |

### Release Process

1. Update `src/manifest.json` version
2. Create git tag: `git tag v1.0.0 && git push origin v1.0.0`
3. Publish GitHub Release
4. Workflow validates version match, builds, and attaches `send-to-gtask.zip`

### Gotchas

- Tag format must be `v{version}` (e.g., `v1.0.0`)
- Manifest version must match tag (without `v` prefix)
- No Google OAuth secrets needed for CI/CD (release workflow builds only, doesn't upload to store)

## Gotchas

### Service Worker (MV3)

- Service workers are **ephemeral** — they terminate after ~30s of inactivity. Never store state in module-level variables; use `chrome.storage.session` or `chrome.storage.local`.
- **Never use `localStorage`** in service workers (no DOM access).
- **Never use `setTimeout`** for deferred actions — use `chrome.alarms.create()` + `chrome.alarms.onAlarm`. This includes badge clearing and notification dismissal.
- **Chrome clamps `chrome.alarms` delays to 1 minute** for packed/production extensions. In development (unpacked), shorter delays work. Design badge clears and notification dismissals knowing the minimum production delay is 60 seconds.
- Need DOM access (audio, canvas, clipboard)? Use **offscreen documents** via `chrome.offscreen.createDocument()`.
- No `eval()` or `new Function()` — blocked by MV3 CSP.

### Offline Queue Sync

The offline queue uses a lock in `chrome.storage.session` to prevent concurrent syncs. When writing lock/unlock patterns with `chrome.storage`, remember that `Date.now()` returns different values on each call — store timestamps in a variable before comparing.

```ts
// Correct: store timestamp in variable
const expiry = Date.now() + 30000
await chrome.storage.session.set({ [KEY]: expiry })
const verify = await chrome.storage.session.get([KEY])
return verify[KEY] === expiry  // compare against stored variable

// Wrong: Date.now() returns different values
await chrome.storage.session.set({ [KEY]: Date.now() + 30000 })
return verify[KEY] === Date.now() + 30000  // always false!
```

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

### Authentication (chrome.identity)

This extension uses a **Chrome Extension client type** in Google Cloud Console with `chrome.identity.getAuthToken()`. Key rules:

- **Never use `launchWebAuthFlow`** with Chrome Extension client type — it requires a `redirect_uri` that Chrome Extension clients don't support. Use `getAuthToken()` for both interactive and non-interactive flows.
- The `oauth2.client_id` and `oauth2.scopes` in `manifest.json` must match the Google Cloud Console configuration.
- For logout, **both** `removeCachedAuthToken` (local cache) **AND** token revocation via Google's endpoint (`https://accounts.google.com/o/oauth2/revoke?token=...`) are needed for a clean re-login experience.

### Notifications

Using `chrome.notifications` requires the `"notifications"` permission in `manifest.json`. Without it, `chrome.notifications` will be `undefined` at runtime. Always ensure manifest permissions match API usage.

## Code Organization Rules

### No Duplicate Utility Functions

Before writing a utility function, check if it already exists elsewhere in `src/`. Common candidates for duplication: `normalizeUrl()`, date formatting, error type guards. Shared utilities should live in their own module under `src/utils/`.

### Task Creation Must Go Through `createTaskFromOptions`

All task creation paths (popup form, quick save, offline retry) should use `createTaskFromOptions()` as the single entry point. This ensures consistent behavior for:

- Notes formatting (with URL marker)
- Offline queue fallback for network errors
- Auth retry on 401
- Notes truncation

`createTaskFromCurrentPage()` should be a thin wrapper that gathers tab info and delegates to `createTaskFromOptions`.
