# Implementation Plan: Code Review Fixes

**Branch**: `002-code-review-fixes` | **Date**: 2026-04-08 | **Spec**: [spec.md](./spec.md)

## Summary

Address all 23 findings from the multi-agent code review of the send-to-gtask Chrome MV3 extension. Fixes are organized into four workstreams: (A) broken build toolchain, (B) runtime bugs and API correctness, (C) accessibility WCAG 2.1 AA compliance, (D) test quality and coverage enforcement. Workstream A unblocks all others and must be completed first. Workstreams B, C, and D can proceed in any order once A is done.

## Technical Context

**Language/Version**: TypeScript 5.4+ with strict mode  
**Primary Dependencies**: Chrome Extension APIs (MV3), Google Tasks REST API, `@types/chrome`, Vite 5.x + esbuild, Vitest 1.x, ESLint 9.x + `@typescript-eslint` (new), `chrome.alarms` API (new usage)  
**Storage**: `chrome.storage.local` (preferences + cached lists), `chrome.storage.session` (new — pending badge clear state)  
**Testing**: Vitest 1.x with jsdom, `@vitest/coverage-v8`, 80% threshold enforcement  
**Target Platform**: Chrome Extension Manifest V3, Chrome 120+  
**Project Type**: Single project (Chrome Extension)  
**Performance Goals**: <100ms UI interactions, <500KB total bundle  
**Constraints**: MV3 service worker lifecycle (no long-lived background pages); `chrome.alarms` minimum 1-minute delay in packed production extensions  

## Constitution Check

### I. Test-First Development ✅

All fixes must be implemented TDD:
1. Write failing test for the specific bug or requirement
2. Confirm test fails (red)
3. Implement minimum fix to pass (green)
4. Refactor

The new test files (`popup.test.ts`, `service-worker.test.ts`, `options.test.ts`) must be written before their corresponding source fixes.

### II. Security & Privacy First ✅

This feature improves the security posture:
- Token invalidation on 401 (FR-006) closes an auth token cache leak
- `encodeURIComponent(listId)` (FR-010) closes a URL path injection vector
- Storage `lastError` handling (FR-009) prevents silent write failures that could mask data loss
- Sender validation in `onMessage` (`sender.id !== chrome.runtime.id`) is added

No new permissions requested. No new user data collected or transmitted.

### III. Simplicity & Direct Solutions ✅

All fixes are targeted and minimal:
- No new abstractions beyond what's needed (single `isAppError` predicate, single `createMockTab` factory)
- No new service layers or design patterns introduced
- Dead code (3 unused types) removed rather than retained
- `chrome.alarms` replaces `setTimeout` — same purpose, different mechanism, no added complexity

### IV. Extension Performance Standards ✅

- Replacing `vitest-chrome` (unused) with ESLint dependencies has no runtime impact
- esbuild minification (replacing broken terser reference) produces equivalent or faster output
- `chrome.storage.session` for badge state adds <10 bytes of transient data
- No new lazy-loaded modules needed; existing bundle structure unchanged

**Constitution Check Result**: PASS — no violations requiring justification

## Project Structure

### Documentation (this feature)

```text
specs/002-code-review-fixes/
├── plan.md                          # This file
├── research.md                      # Phase 0 — all decisions resolved
├── data-model.md                    # Phase 1 — type changes documented
├── quickstart.md                    # Phase 1 — developer setup guide
├── contracts/
│   └── chrome-messages.md           # Phase 1 — internal message contract
└── tasks.md                         # Phase 2 — /speckit.tasks output (not yet created)
```

### Source Code

```text
src/
├── background/
│   └── service-worker.ts            # Replace setTimeout with chrome.alarms; type messages; fix return true
├── options/
│   ├── options.css                  # Add :focus-visible; prefers-reduced-motion
│   ├── options.html                 # ARIA improvements
│   └── options.ts                  # Use isAppError; fix populateListDropdown non-null assertion
├── popup/
│   ├── popup.css                    # Fix contrast colours; add :focus-visible; prefers-reduced-motion
│   ├── popup.html                   # Add #auth-container; role="status"; aria-live; aria-hidden
│   └── popup.ts                     # Auth state; async handleRetry; use isAppError; PERMISSION_DENIED
├── services/
│   ├── auth.ts                      # No changes needed
│   ├── page-capture.ts              # No changes needed
│   ├── storage.ts                   # Add lastError checks to all 4 Promise wrappers
│   ├── task-creation.ts             # 401 retry loop; TasksAPIError for null token; notes length validation
│   └── tasks-api.ts                 # Fix super(code); split 403/429; encodeURIComponent; typed json()
└── types/
    └── index.ts                     # Add PERMISSION_DENIED, ExtensionMessage, isAppError; remove dead types

tests/
├── integration/
│   ├── auth-flow.test.ts            # No changes needed
│   └── task-creation.test.ts        # Add 401-retry test; add Authorization header assertion
├── unit/
│   ├── auth.test.ts                 # No changes needed
│   ├── list-selection.test.ts       # DELETE — merge into storage.test.ts
│   ├── options.test.ts              # NEW — loadData, savePreference, deleted-list, sign-in
│   ├── page-capture.test.ts         # Replace inline tabs with createMockTab(); add whitespace-only title test
│   ├── popup.test.ts                # NEW — getErrorMessage, all 4 states including auth, handleRetry
│   ├── service-worker.test.ts       # NEW — onMessage, badge functions, alarm firing
│   ├── storage.test.ts              # Add vi.useFakeTimers(); absorb list-selection.test.ts tests
│   ├── task-lists.test.ts           # DELETE — merge into tasks-api.test.ts
│   └── tasks-api.test.ts            # Add PERMISSION_DENIED, 5xx, malformed JSON tests; absorb task-lists.test.ts
└── setup.ts                         # Export DEFAULT_MOCK_TOKEN; add createMockTab(); fix onMessage firing

# New root-level files
tsconfig.test.json                   # NEW — extends tsconfig.json; adds vitest/globals
eslint.config.js                     # NEW — ESLint flat config for TypeScript
```

## Phase 0: Research — Complete

All unknowns resolved. See [research.md](./research.md) for full decision rationale.

| Decision | Resolution |
|---|---|
| MV3 badge clearing | `chrome.alarms` + `chrome.storage.session` for durable state |
| 401 retry loop | Single retry in `task-creation.ts`; `removeToken` + `getToken(true)` + one retry |
| 403 vs 429 | New `PERMISSION_DENIED` error code; separate error message |
| ESLint | `eslint` + `@typescript-eslint/*`; flat config `eslint.config.js` |
| tsconfig split | Remove `rootDir`; new `tsconfig.test.json` with `vitest/globals` |
| Fake timers | `vi.useFakeTimers()` + `vi.setSystemTime()` in storage tests |
| WCAG colours | `#c5221f` error, `#137333` success, `#5f6368` status in popup |
| Auth popup state | New `#auth-container` div; shown on `AUTH_REQUIRED` after retry exhausted |
| `isAppError` location | `src/types/index.ts` named export |
| `createMockTab` location | `tests/setup.ts` named export |
| Coverage thresholds | 80% global + per-file overrides for popup/options/service-worker |
| `encodeURIComponent` | Applied to `listId` in both URL constructions in `tasks-api.ts` |
| Storage `lastError` | Reject Promise; callers' try/catch surfaces error |
| Notes length | Truncate to `MAX_NOTES_LENGTH` in `task-creation.ts` before API call |

## Phase 1: Design — Complete

### Type System Changes (data-model.md)

1. **`AppError.code`**: Add `'PERMISSION_DENIED'` to the union type
2. **`ExtensionMessage`**: New discriminated union `{ type: 'TASK_CREATED' | 'TASK_ERROR'; tabId?: number }`
3. **`isAppError(e: unknown): e is AppError`**: New type predicate exported from `src/types/index.ts`
4. **Dead type removal**: Remove `Task`, `StorageSchema`, `GoogleAPIError` from `src/types/index.ts`

### Internal Contracts (contracts/)

Chrome message passing contract defined in [contracts/chrome-messages.md](./contracts/chrome-messages.md):
- `TASK_CREATED` message: popup → service worker on success
- `TASK_ERROR` message: popup → service worker on failure
- `'clear-badge'` alarm: service worker → service worker for durable badge clearing
- `pendingBadgeClear` session storage entry for alarm→badge handoff

### Workstream Implementation Details

#### Workstream A: Build Tooling (P0 — must complete first)

**`vite.config.ts`** changes:
- `minify: 'terser'` → `minify: 'esbuild'`
- Remove `emptyDirBeforeWrite: true` (not a valid Vite option; replace with `emptyOutDir: true`)

**`package.json`** changes:
- Add to `devDependencies`: `eslint`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`
- Remove from `devDependencies`: `vitest-chrome` (unused)
- Add scripts: `"type-check": "tsc --noEmit"`, `"test:ci": "vitest run --coverage"`

**`tsconfig.json`** changes:
- Remove `"rootDir": "./src"` (conflicts with `include` covering `tests/`)
- Change `"types": ["chrome", "vitest/globals"]` → `"types": ["chrome"]`

**`tsconfig.test.json`** (new file):
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

**`eslint.config.js`** (new file):
```js
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'

export default [
  {
    files: ['src/**/*.ts'],
    languageOptions: { parser: tsParser },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  }
]
```

---

#### Workstream B: Runtime Bug Fixes

**`src/types/index.ts`**:
- Add `'PERMISSION_DENIED'` to `AppError.code` union
- Add `ExtensionMessage` discriminated union export
- Add `isAppError` type predicate export
- Remove `Task`, `StorageSchema`, `GoogleAPIError` interfaces (unused)

**`src/services/tasks-api.ts`**:
- `TasksAPIError` constructor: `super(code)` → `super(message)`
- `handleErrorResponse` case 403: throw `PERMISSION_DENIED` with message "Access denied. You may need to re-authorize the extension."
- URL construction: `${TASKS_API_BASE_URL}/tasks/v1/lists/${encodeURIComponent(listId)}/tasks`
- `createTask` return: `return response.json() as Promise<TaskResponse>` inside try/catch for JSON parse failures
- `getTaskLists` cache check: change `cachedLists!.lists` to use type predicate on `isCacheValid` return
- `onMessage` return: change `return true` to `return false` (synchronous responses)

**`src/services/storage.ts`**:
- All 4 Promise wrappers: check `chrome.runtime.lastError` and `reject(new Error(...))` before resolving
- `isCacheValid`: change return type to type predicate `cache is CachedTaskLists`

**`src/services/task-creation.ts`**:
- 401 retry loop:
  ```typescript
  let token = await getToken(true)
  if (!token) throw new TasksAPIError('AUTH_REQUIRED', 'Authentication required.', false)
  
  try {
    return await createTask(token, encodedListId, taskRequest)
  } catch (err) {
    if (isAppError(err) && err.code === 'AUTH_REQUIRED') {
      await removeToken(token)
      token = await getToken(true)
      if (!token) throw err
      return await createTask(token, encodedListId, taskRequest)
    }
    throw err
  }
  ```
- Notes length: `const notes = pageInfo.url.slice(0, MAX_NOTES_LENGTH)`

**`src/popup/popup.ts`**:
- Add `authContainer: HTMLElement | null` and `signInButton: HTMLElement | null` element refs
- Add `showAuth()` state function that shows `#auth-container`
- In `getErrorMessage`: add `'PERMISSION_DENIED'` case: "Access denied. You may need to re-authorize."
- In `createTask` catch: detect `AUTH_REQUIRED` and call `showAuth()` instead of `showError()`
- `handleRetry`: make async, `await createTask()`
- `notifyServiceWorker`: add `.catch(() => {})` on `sendMessage`
- Use `isAppError` from types instead of manual duck-typing

**`src/popup/popup.html`**:
- Add auth state container between error and success:
  ```html
  <div id="auth-container" class="auth-container hidden">
    <p class="auth-message">Sign in to create tasks.</p>
    <button id="sign-in-button" class="sign-in-button" aria-label="Sign in with Google">Sign In with Google</button>
  </div>
  ```
- `#status`: add `role="status"` `aria-live="polite"`
- `#status-icon` spinner: add `aria-hidden="true"`
- `.success-icon` checkmark: add `aria-hidden="true"`
- `#retry-button`: add `aria-label="Retry creating task"`

**`src/background/service-worker.ts`**:
- Import `ExtensionMessage` from types
- Replace `setTimeout` in `showSuccessBadge` and `showErrorBadge` with `chrome.storage.session.set` + `chrome.alarms.create('clear-badge', { when: Date.now() + clearMs })`
- Add `chrome.alarms.onAlarm.addListener` handler
- `onMessage`: type `message` parameter as `ExtensionMessage`; add `sender.id` validation; return `false` (not `true`)
- Remove `export {}` (redundant — file already has named exports)

---

#### Workstream C: Accessibility

**`src/popup/popup.css`**:
- `.error-message`: `color: #ea4335` → `color: #c5221f`
- `.success-message`: `color: #34a853` → `color: #137333`
- `.status-message`: `color: #666` → `color: #5f6368`
- Add focus styles:
  ```css
  .retry-button:focus-visible,
  .sign-in-button:focus-visible {
    outline: 2px solid #4285f4;
    outline-offset: 2px;
  }
  ```
- Add motion preference:
  ```css
  @media (prefers-reduced-motion: reduce) {
    .status-icon { animation: none; }
  }
  ```

**`src/options/options.css`**:
- Add `:focus-visible` styles to all button selectors (`.button:focus-visible`)
- Add `prefers-reduced-motion` for `.spinner`

**`src/options/options.html`**:
- Spinner `<div class="spinner">`: add `aria-hidden="true"`
- Status message container: add `role="status"` `aria-live="polite"`
- Buttons: add descriptive `aria-label` where button text is ambiguous

---

#### Workstream D: Test Quality

**`vitest.config.ts`** — add coverage thresholds:
```typescript
coverage: {
  // ...existing config...
  thresholds: {
    statements: 80,
    branches: 80,
    functions: 80,
    lines: 80,
    perFile: true
  }
}
```

**`tests/setup.ts`**:
- Export `DEFAULT_MOCK_TOKEN = 'mock-auth-token-12345'`
- Export `createMockTab(overrides?: Partial<chrome.tabs.Tab>): chrome.tabs.Tab` factory
- Add `chrome.alarms` mock (`.create`, `.onAlarm.addListener`)
- Add `chrome.storage.session` mock
- Add `chrome.runtime.onMessage` event-firing capability (store registered listener, expose `triggerMessage(msg)` helper)

**New `tests/unit/popup.test.ts`**:
- `getErrorMessage` — one test per error code including `PERMISSION_DENIED`
- `showLoading`, `showSuccess`, `showError`, `showAuth` — DOM state transitions
- `handleRetry` — async, surfaces error, does not double-fire
- Auto-close timeout — uses fake timers

**New `tests/unit/service-worker.test.ts`**:
- `onMessage` with `TASK_CREATED` — calls `showSuccessBadge`, returns `false`
- `onMessage` with `TASK_ERROR` — calls `showErrorBadge`, returns `false`
- `onMessage` with unknown sender — ignored
- `showSuccessBadge` — sets badge text/colour, creates alarm, writes session storage
- `showErrorBadge` — sets badge text/colour, creates alarm, writes session storage
- Alarm listener — reads session storage, clears badge, removes session entry

**New `tests/unit/options.test.ts`**:
- `loadData` — loading state, populates dropdown, handles cache miss
- `loadData` error — shows error state
- `loadData` with deleted list — resets to default, shows warning
- `savePreference` — writes to storage, shows success message
- `handleSignIn` — calls `getToken(true)` interactively

**`tests/unit/tasks-api.test.ts`** — add:
- 403 → `PERMISSION_DENIED` (not `RATE_LIMITED`)
- 5xx → `API_ERROR` with `retryable: true`
- `response.json()` throws — surfaced as `API_ERROR`
- Absorb all tests from `tests/unit/task-lists.test.ts`

**`tests/unit/storage.test.ts`** — add:
- `vi.useFakeTimers()` in `beforeEach` for timestamp tests
- `chrome.runtime.lastError` rejection tests for `setPreferences` and `setCachedLists`
- Absorb tests from `tests/unit/list-selection.test.ts`

**`tests/unit/page-capture.test.ts`** — add:
- Whitespace-only title → domain fallback
- Replace all inline tab literals with `createMockTab()` calls

**`tests/integration/task-creation.test.ts`** — add:
- 401 → `removeToken` → retry → success scenario
- Verify `Authorization: Bearer <token>` header is present in `createTask` fetch call
- Replace inline tab literals with `createMockTab()`

**Delete**:
- `tests/unit/list-selection.test.ts` (tests moved to `storage.test.ts`)
- `tests/unit/task-lists.test.ts` (tests moved to `tasks-api.test.ts`)
