# Research: Send Page to Google Tasks

**Date**: 2025-11-25
**Branch**: `001-send-page-to-gtask`

## 1. Chrome Extension OAuth2 Authentication

### Decision
Use `chrome.identity.getAuthToken()` with Chrome's built-in OAuth2 flow for Google authentication in Manifest V3.

### Rationale
- **Automatic token management**: Chrome caches tokens and handles expiration automatically
- **Secure UI**: Chrome-managed consent screen, no custom UI needed
- **MV3 compatible**: Works with ephemeral service workers
- **Minimal code**: Single API call vs manual OAuth flow implementation
- **No backend required**: Token exchange handled by Chrome

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| `launchWebAuthFlow()` | Only for non-Google OAuth; requires manual refresh token handling |
| External OAuth library | Unnecessary complexity; increases bundle size |
| Backend token service | Violates simplicity principle; requires infrastructure |

### Key Implementation Notes
```json
// manifest.json
{
  "manifest_version": 3,
  "permissions": ["identity", "storage"],
  "oauth2": {
    "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
    "scopes": ["https://www.googleapis.com/auth/tasks"]
  }
}
```

- Client ID must be created as "Chrome app" type in Google Cloud Console
- Token refresh: On 401 response, call `chrome.identity.removeCachedAuthToken()` then retry
- Use `interactive: true` only on user-triggered actions (not background)

---

## 2. Google Tasks API Integration

### Decision
Use direct REST API calls with fetch() to Google Tasks API endpoints. No SDK or library.

### Rationale
- **Minimal bundle size**: No googleapis package (~2MB saved)
- **Simplicity**: Direct HTTP calls align with constitution Principle III
- **Full control**: Easy to implement retry logic and error handling
- **Performance**: No abstraction overhead

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| googleapis npm package | Adds ~2MB to bundle; overkill for 2 endpoints |
| Google JavaScript SDK (gapi.js) | Deprecated; larger footprint |
| Third-party Tasks library | Unnecessary dependency; simple API |

### Key API Details

**Base URL**: `https://tasks.googleapis.com`

**Endpoints Required**:

| Operation | Endpoint | Method |
|-----------|----------|--------|
| Create Task | `/tasks/v1/lists/{tasklist}/tasks` | POST |
| List Task Lists | `/tasks/v1/users/@me/lists` | GET |

**OAuth Scope**: `https://www.googleapis.com/auth/tasks` (full read/write)

**Task Object Structure**:
```json
{
  "title": "Page title (max 1024 chars)",
  "notes": "https://example.com/page (max 8192 chars)"
}
```

**Rate Limits**:
- 50,000 API calls per day (more than sufficient)
- Handle 403/429 with exponential backoff (5s, 10s, 20s)

**Error Handling**:

| Code | Action |
|------|--------|
| 401 | Refresh token via `removeCachedAuthToken()` + retry |
| 403/429 | Exponential backoff (max 5 retries) |
| 404 | List deleted; fall back to default list |
| 503 | API down; show error with retry option |

---

## 3. Testing with Vitest

### Decision
Use Vitest with `vitest-chrome` package for Chrome API mocking. Dependency injection pattern for business logic.

### Rationale
- **Fast**: Vitest significantly faster than Jest with better HMR
- **TypeScript-native**: First-class TS support
- **Complete mocking**: `vitest-chrome` provides typed mocks for all Chrome APIs
- **MV3 compatible**: Proper service worker testing patterns

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Jest + jest-chrome | Slower; less Vitest ecosystem integration |
| Manual mocking | Tedious; high maintenance |
| Puppeteer E2E | Too slow for unit tests; integration only |

### Key Configuration

**vitest.config.ts**:
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      exclude: ['**/node_modules/**', '**/dist/**']
    }
  }
})
```

**tests/setup.ts**:
```typescript
import { vi } from 'vitest'
import * as chrome from 'vitest-chrome'

Object.assign(global, chrome)
```

**Dependencies**:
```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "vitest-chrome": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0"
  }
}
```

### Testing Patterns

**Chrome Storage Mock**:
```typescript
chrome.storage.local.get.mockImplementation((keys, callback) => {
  callback({ selectedList: 'default-list-id' })
})
```

**Identity API Mock**:
```typescript
chrome.identity.getAuthToken.mockImplementation((options, callback) => {
  callback('mock-token')
})
```

**Event Listeners**:
```typescript
chrome.tabs.onUpdated.callListeners(tabId, changeInfo, tab)
```

---

## 4. Build & Bundle Strategy

### Decision
Use Vite for bundling with minimal configuration. Target ES2020+ for modern browsers.

### Rationale
- **Fast builds**: Vite's esbuild-based bundling
- **Tree-shaking**: Automatic dead code elimination
- **TypeScript**: Native support without additional setup
- **Small output**: Meets <500KB bundle size constraint

### Build Configuration

**vite.config.ts**:
```typescript
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: 'src/popup/popup.html',
        background: 'src/background/service-worker.ts'
      },
      output: {
        entryFileNames: '[name].js'
      }
    },
    target: 'es2020',
    minify: 'terser'
  }
})
```

---

## Summary

| Area | Decision | Bundle Impact |
|------|----------|---------------|
| Auth | chrome.identity API | ~0KB (built-in) |
| Tasks API | Direct fetch() | ~0KB |
| Testing | Vitest + vitest-chrome | dev only |
| Bundler | Vite | dev only |
| Total Runtime | Minimal dependencies | <50KB estimated |

All technical unknowns resolved. Ready for Phase 1 design.
