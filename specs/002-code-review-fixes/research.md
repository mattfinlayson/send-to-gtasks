# Research: Code Review Fixes

**Feature**: 002-code-review-fixes
**Date**: 2026-04-08

---

## Decision 1: MV3 Badge Clearing — `chrome.alarms` vs `setTimeout`

**Decision**: Replace `setTimeout` with `chrome.alarms` for badge clearing. Store pending badge state in `chrome.storage.session` so the alarm listener can read it after service worker restart.

**Rationale**: MV3 service workers are ephemeral — Chrome can terminate them between a `setTimeout` registration and its callback firing. `chrome.alarms` are durable: Chrome wakes the service worker to fire them even after termination. `chrome.storage.session` persists data for the lifetime of the browser session and is the correct MV3 pairing for per-activation transient state.

**Implementation pattern**:
```
1. On badge set: chrome.storage.session.set({ pendingBadgeClear: { tabId, type } })
2. chrome.alarms.create('clear-badge', { when: Date.now() + clearDelayMs })
3. chrome.alarms.onAlarm.addListener: read pendingBadgeClear, clear badge, delete entry
```

**Known constraint**: Chrome clamps alarm delays to 1 minute for production (packed) extensions when `when` or `delayInMinutes` is below 1 minute. This means in production the badge may persist for up to 1 minute on service worker termination. In the non-termination case (common), `chrome.alarms` still fires sooner. This is a cosmetic tradeoff — the badge not clearing for 1 minute is acceptable vs. never clearing. Document this as a known production behaviour.

**Alternatives considered**:
- Keep `setTimeout`: Simple but may never fire if service worker is terminated. Rejected.
- `chrome.storage.session` + check on next message: Clears only on next user interaction — too unpredictable. Rejected.
- Accept stale badge indefinitely: Misleads users. Rejected.

---

## Decision 2: 401 Token Refresh Retry Loop

**Decision**: Implement retry in `task-creation.ts` as the orchestration layer. On catching a `TasksAPIError` with `code === 'AUTH_REQUIRED'` from `createTask`, call `removeToken(expiredToken)`, acquire a fresh token via `getToken(true)`, and retry the API call exactly once.

**Rationale**: The orchestrator (`task-creation.ts`) is the correct place because it owns the full flow and has access to both the auth service and the API service. Limiting to one retry prevents infinite loops. Token passed into the retry must be the freshly acquired one, not the stale one.

**Pattern**:
```
token = await getToken(true)
try:
  result = await createTask(token, listId, taskRequest)
catch AUTH_REQUIRED:
  await removeToken(token)
  token = await getToken(true)          // interactive second attempt
  result = await createTask(token, listId, taskRequest)  // second attempt
```

**Alternatives considered**:
- Retry in `tasks-api.ts`: Would require `tasks-api.ts` to import `auth.ts`, creating a circular dependency risk. Rejected.
- Retry in `popup.ts`: Presentation layer should not contain auth retry logic. Rejected.

---

## Decision 3: HTTP 403 vs 429 Error Handling

**Decision**: Separate 403 and 429 into distinct error codes. 403 → `PERMISSION_DENIED` (new code). 429 → `RATE_LIMITED` (existing code). Add `PERMISSION_DENIED` to the `AppError.code` union in `types/index.ts`.

**Rationale**: HTTP 403 from Google Tasks API indicates "Forbidden" — typically an insufficient OAuth scope or account permission issue, not a rate limit. Users with wrong scopes need to re-authorize, not wait. Showing "Too many requests" for a scope issue is actively misleading.

**Error message for PERMISSION_DENIED**: "Access denied. You may need to re-authorize the extension."

**Alternatives considered**:
- Read the response body to distinguish 403 subtypes (quota vs. permission): More accurate but adds complexity. The primary benefit (correct user message) is achieved by just separating 403 from 429. Reading the body is an enhancement for later. Rejected for now.

---

## Decision 4: ESLint Configuration

**Decision**: Add `eslint`, `@typescript-eslint/eslint-plugin`, and `@typescript-eslint/parser` to `devDependencies`. Use a flat config (`eslint.config.js`) targeting TypeScript source files in `src/`. Remove `vitest-chrome` (unused).

**Rationale**: The lint script already references `eslint src --ext .ts`. Adding the packages makes it functional. Flat config (`eslint.config.js`) is the modern ESLint 9.x format and avoids the deprecated `.eslintrc` format.

**Minimal config rules**:
- `@typescript-eslint/no-explicit-any`: warn (helps catch `any` returns from `json()`)
- `@typescript-eslint/no-floating-promises`: error (catches unhandled Promise from `handleRetry`)
- `no-unused-vars` via `@typescript-eslint/no-unused-vars`: error

**Alternatives considered**:
- Keep broken lint script, just fix the package reference: Partial fix. Rejected.
- Use `.eslintrc.json` (legacy format): Works but deprecated. Rejected in favor of flat config.

---

## Decision 5: TypeScript Config Split

**Decision**: Remove `rootDir: "./src"` from `tsconfig.json` (conflicts with `include: ["tests/**/*"]`). Remove `"vitest/globals"` from main `tsconfig.json` types. Create `tsconfig.test.json` that extends the base and adds `"vitest/globals"` and widens `rootDir`. Point Vitest's `typecheck` (if enabled) to `tsconfig.test.json`.

**Rationale**: `rootDir: "./src"` with `include` covering `tests/` causes TypeScript to error because test files are outside `rootDir`. Vitest globals (`describe`, `it`, `expect`) in the main tsconfig pollute production source files with test-only globals.

**tsconfig.json change**: Remove `rootDir`, keep `outDir`. Change `types` to `["chrome"]` only.

**tsconfig.test.json** (new):
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": ["chrome", "vitest/globals"],
    "noUnusedLocals": false,
    "noUnusedParameters": false
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

**Alternatives considered**:
- Set `rootDir: "."`: Makes `outDir: "./dist"` potentially include test compilation output. Rejected.
- Keep merged config: The `rootDir` error blocks `tsc --noEmit`. Rejected.

---

## Decision 6: Vitest Fake Timers for Timestamp Tests

**Decision**: Use `vi.useFakeTimers()` in `beforeEach` and `vi.useRealTimers()` in `afterEach` (or `afterAll`) for tests in `storage.test.ts` that assert `cachedAt` timestamps. Use `vi.setSystemTime(fixedDate)` to set a deterministic time.

**Pattern**:
```typescript
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
})
afterEach(() => {
  vi.useRealTimers()
})
```

**Rationale**: `Date.now()` is non-deterministic under system load. Fake timers eliminate the entire class of flaky timestamp comparison failures.

---

## Decision 7: WCAG 2.1 AA Colour Compliance for Popup

**Decision**: Update popup text colours to match the already-compliant `options.css` values:
- Error text: `#ea4335` (3.9:1, fails) → `#c5221f` (~5.9:1, passes AA)
- Success text: `#34a853` (3.0:1, fails) → `#137333` (~7.1:1, passes AAA)
- Status text: `#666` (4.3:1, borderline) → `#5f6368` (~5.3:1, passes AA)

**Rationale**: These exact values are already in `options.css` and pass AA. Using the same values ensures visual consistency between popup and options pages.

---

## Decision 8: Auth State in Popup

**Decision**: Add a fourth `#auth-container` state to the popup (alongside loading, success, error). When `createTask` catches an error with `code === 'AUTH_REQUIRED'` AND it is the initial attempt (not the post-retry attempt), show the auth container with a "Sign In with Google" button instead of the generic error container. The Sign In button calls `getToken(true)` interactively and then retries task creation.

**Rationale**: The auth container already exists in `options.html`. The popup collapsing `AUTH_REQUIRED` into the generic error container with a "Retry" button is a UX dead end — the Retry button will call `getToken(true)` which is the same thing the Sign In button should do. The distinction is UX clarity: a sign-in button communicates intent better than a generic retry.

**Implementation note**: After the token refresh retry loop is implemented in `task-creation.ts`, the popup will only see `AUTH_REQUIRED` if the retry also failed (e.g., user cancelled the OAuth dialog). In that case, the auth container gives the user a clear option to try again interactively.

---

## Decision 9: `isAppError` Type Predicate Location

**Decision**: Add `isAppError(e: unknown): e is AppError` to `src/types/index.ts` as a named export. Both `popup.ts` and `options.ts` already import from `src/types`, so no new import is needed.

**Rationale**: Eliminates duplicated duck-typing in two files and centralises the check with the type it guards.

---

## Decision 10: `createMockTab` Factory Location

**Decision**: Add `createMockTab(overrides?: Partial<chrome.tabs.Tab>): chrome.tabs.Tab` to `tests/setup.ts` as a named export. All test files already import from `tests/setup.ts`.

**Default tab**:
```typescript
{
  id: 1, index: 0, pinned: false, highlighted: false, windowId: 1,
  active: true, incognito: false, selected: false, discarded: false,
  autoDiscardable: true, groupId: -1,
  url: 'https://example.com', title: 'Example Page'
}
```

---

## Decision 11: Coverage Thresholds

**Decision**: Set Vitest coverage thresholds to 80% for `statements`, `branches`, `functions`, and `lines` globally. Also set per-file thresholds of 80% for `src/popup/popup.ts`, `src/options/options.ts`, and `src/background/service-worker.ts` to enforce that previously zero-coverage files are covered.

Add `"test:ci": "vitest run --coverage"` script to `package.json`.

**Rationale**: 80% is a standard minimum. Per-file overrides for the three zero-coverage files prevent them from dragging down the global average without being covered themselves.

---

## Decision 12: `encodeURIComponent` for `listId`

**Decision**: Wrap `listId` in `encodeURIComponent()` in the URL construction in `tasks-api.ts`. The `@default` ID contains `@`, which while not technically an unsafe URL character, is considered reserved in some contexts. Other list IDs from Google are base64-like and generally URL-safe, but encoding is a correctness guarantee.

---

## Decision 13: Storage `chrome.runtime.lastError` Handling

**Decision**: Add `lastError` checks to all 4 Promise wrappers in `storage.ts`. On error, `reject` the Promise with an `Error` containing the `lastError.message`. The callers already have `try/catch` blocks that will surface these as user-visible errors.

**Pattern for each wrapper**:
```typescript
chrome.storage.local.set({ key: value }, () => {
  if (chrome.runtime.lastError) {
    reject(new Error(chrome.runtime.lastError.message))
  } else {
    resolve()
  }
})
```

---

## Decision 14: URL Length Validation

**Decision**: In `task-creation.ts`, truncate `pageInfo.url` to `MAX_NOTES_LENGTH` (8192) before passing it as `notes` to `createTask`. Log a warning if truncation occurs but do not surface it as a user error.

**Rationale**: URLs exceeding 8192 characters are essentially only data URIs. Truncating silently is acceptable because the core user intent (saving the page) is still fulfilled.
