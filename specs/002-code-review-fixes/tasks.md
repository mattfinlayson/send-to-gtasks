# Tasks: Code Review Fixes

**Branch**: `002-code-review-fixes`
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**TDD Required**: All implementation tasks must be preceded by a failing test (constitution §I)

## Format: `[ID] [P?] [Story] Description — file path`

- **[P]**: Can run in parallel (different files, independent of in-progress tasks)
- **[US#]**: User story this task belongs to
- **TDD rule**: Tasks labelled `Write failing test` MUST fail before the paired implementation task begins

---

## Phase 1: Setup — Build Toolchain Configuration

**Purpose**: Fix broken build infrastructure. No user story label — these are prerequisites for all subsequent work.

- [x] T001 Update `vite.config.ts` — change `minify: 'terser'` to `minify: 'esbuild'`; replace `emptyDirBeforeWrite: true` with `emptyOutDir: true`
- [x] T002 Update `package.json` — add `eslint`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser` to devDependencies; remove `vitest-chrome`; add scripts `"type-check": "tsc --noEmit"` and `"test:ci": "vitest run --coverage"`
- [x] T003 Update `tsconfig.json` — remove `"rootDir": "./src"` from compilerOptions; change `"types": ["chrome", "vitest/globals"]` to `"types": ["chrome"]`
- [x] T004 [P] Create `tsconfig.test.json` — extends `./tsconfig.json`; adds `"vitest/globals"` to types; sets `"noUnusedLocals": false` and `"noUnusedParameters": false`; includes `["src/**/*", "tests/**/*"]`
- [x] T005 [P] Create `eslint.config.js` — flat config using `@typescript-eslint/parser`; rules: `no-explicit-any: warn`, `no-floating-promises: error`, `no-unused-vars: error` scoped to `src/**/*.ts`

---

## Phase 2: Foundation — Type System

**Purpose**: Type changes that all subsequent TDD tests import. Must complete before any US2–US6 test tasks.

⚠️ **CRITICAL**: No user story test tasks can be written until T006 is complete.

- [x] T006 Update `src/types/index.ts` — add `'PERMISSION_DENIED'` to `AppError.code` union; add `export type ExtensionMessage = { type: 'TASK_CREATED'; tabId?: number } | { type: 'TASK_ERROR'; tabId?: number }`; add `export function isAppError(e: unknown): e is AppError` type predicate; remove unused interfaces `Task`, `StorageSchema`, `GoogleAPIError`

**Checkpoint**: Type foundation ready — US1 verification and US2–US6 test-first tasks can now begin.

---

## Phase 3: US1 — Extension Builds and Lints Without Errors (P1) 🎯 MVP

**Goal**: `npm run build`, `npm run type-check`, and `npm run lint` all exit 0 on a clean checkout.

**Independent Test**: Run all three commands and verify exit codes are 0.

### Implementation for User Story 1

- [x] T007 [US1] Run `npm install` in repo root to install ESLint dependencies and remove vitest-chrome (requires T002)
- [x] T008 [US1] Verify `npm run build` succeeds — if errors remain, fix `vite.config.ts` until output is clean in `dist/` (requires T001, T007)
- [x] T009 [US1] Verify `npm run type-check` succeeds — if errors remain, fix `tsconfig.json`/`tsconfig.test.json` until `tsc --noEmit` exits 0 (requires T003, T004, T007)
- [x] T010 [US1] Verify `npm run lint` succeeds — if errors remain, fix `eslint.config.js` rules until lint exits 0 (requires T005, T007)

**Checkpoint**: Build, type-check, and lint are all green. US1 complete.

---

## Phase 4: US2 — Runtime Bugs Fixed (P1)

**Goal**: Token refresh works on 401, 403/429 show correct messages, storage errors surface, retry handles errors, listId is URL-encoded, notes are bounded.

**Independent Test**: Exercise each error path in the extension — expired token, 403 response, storage quota error, URL with special characters, URL longer than 8192 chars.

### Tests for User Story 2 (TDD — write first, confirm failing, then implement)

- [x] T011 [US2] Write failing test — `TasksAPIError` `message` property equals the human string (second constructor arg), not the code string in `tests/unit/tasks-api.test.ts`
- [x] T012 [P] [US2] Write failing test — HTTP 403 response in `handleErrorResponse` throws with `code: 'PERMISSION_DENIED'` in `tests/unit/tasks-api.test.ts`
- [x] T013 [P] [US2] Write failing test — `createTask` with listId `'my list@work'` constructs URL with `encodeURIComponent('my list@work')` in `tests/unit/tasks-api.test.ts`
- [x] T014 [P] [US2] Write failing test — `createTask` where `response.json()` throws should reject with `code: 'API_ERROR'` in `tests/unit/tasks-api.test.ts`
- [x] T015 [P] [US2] Write failing test — `getTaskLists` URL includes `?maxResults=100` query parameter in `tests/unit/tasks-api.test.ts`
- [x] T016 [US2] Write failing tests — `setPreferences` and `setCachedLists` reject when `chrome.runtime.lastError` is set in `tests/unit/storage.test.ts`
- [x] T017 [US2] Write failing test — `createTaskFromCurrentPage` calls `removeToken`, acquires fresh token, and succeeds on second `createTask` call after initial `AUTH_REQUIRED` error in `tests/integration/task-creation.test.ts`
- [x] T018 [P] [US2] Write failing test — `createTaskFromCurrentPage` throws `TasksAPIError` with `code: 'AUTH_REQUIRED'` (not generic `Error`) when `getToken` returns `null` in `tests/integration/task-creation.test.ts`
- [x] T019 [P] [US2] Write failing test — task `notes` field is truncated to `MAX_NOTES_LENGTH` (8192) when `tab.url` is longer in `tests/integration/task-creation.test.ts`
- [x] T020 [P] [US2] Write failing test — `getErrorMessage('PERMISSION_DENIED')` returns access-denied string in `tests/unit/popup.test.ts` (create new file)

### Implementation for User Story 2

- [x] T021 [US2] Fix `TasksAPIError` constructor in `src/services/tasks-api.ts` — change `super(code)` to `super(message)` (makes T011 pass)
- [x] T022 [P] [US2] Fix `handleErrorResponse` case 403 in `src/services/tasks-api.ts` — throw `new TasksAPIError('PERMISSION_DENIED', 'Access denied. You may need to re-authorize the extension.', false)` (makes T012 pass)
- [x] T023 [P] [US2] Fix URL construction in `src/services/tasks-api.ts` `createTask` — wrap `listId` in `encodeURIComponent()` in the template literal at line 43 (makes T013 pass)
- [x] T024 [P] [US2] Fix `createTask` in `src/services/tasks-api.ts` — wrap `response.json()` in try/catch; cast return as `Promise<TaskResponse>`; catch parse errors and rethrow as `new TasksAPIError('API_ERROR', ...)` (makes T014 pass)
- [x] T025 [P] [US2] Fix `getTaskLists` URL in `src/services/tasks-api.ts` — append `?maxResults=100` to `${TASKS_API_BASE_URL}/tasks/v1/users/@me/lists` (makes T015 pass)
- [x] T026 [US2] Fix all 4 Promise wrappers in `src/services/storage.ts` — add `if (chrome.runtime.lastError) { reject(new Error(chrome.runtime.lastError.message)) } else { resolve(...) }` to each callback (makes T016 pass)
- [x] T027 [US2] Fix `isCacheValid` in `src/services/storage.ts` — change return type to `cache is CachedTaskLists` type predicate; update `tasks-api.ts` line 123 to remove `!` non-null assertion
- [x] T028 [US2] Implement 401 retry loop in `src/services/task-creation.ts` — on catching `TasksAPIError` with `code === 'AUTH_REQUIRED'` from first `createTask` call: call `removeToken(token)`, call `getToken(true)` for fresh token, call `createTask` once more (makes T017 pass)
- [x] T029 [P] [US2] Fix null token error in `src/services/task-creation.ts` — replace `throw new Error('Failed to get authentication token')` with `throw new TasksAPIError('AUTH_REQUIRED', 'Authentication required. Please sign in.', false)` (makes T018 pass)
- [x] T030 [P] [US2] Add notes length truncation in `src/services/task-creation.ts` — set `notes: pageInfo.url.slice(0, MAX_NOTES_LENGTH)` (makes T019 pass)
- [x] T031 [P] [US2] Add `'PERMISSION_DENIED'` case to `getErrorMessage` in `src/popup/popup.ts` — return `'Access denied. You may need to re-authorize the extension.'` (makes T020 pass)
- [x] T032 [P] [US2] Replace manual duck-typing in `src/popup/popup.ts` line 84 — use `isAppError(error)` imported from `../types` instead of `'code' in error` check
- [x] T033 [P] [US2] Replace manual duck-typing in `src/options/options.ts` line 144 — use `isAppError(err)` imported from `../types` instead of `'code' in err` check
- [x] T034 [P] [US2] Fix `handleRetry` in `src/popup/popup.ts` — make function `async` and add `await` before `createTask()`
- [x] T035 [P] [US2] Fix `notifyServiceWorker` in `src/popup/popup.ts` — add `.catch(() => { /* service worker inactive — badge update is best-effort */ })` after `chrome.runtime.sendMessage({ type })`

**Checkpoint**: All runtime bugs fixed. 401 retry works, 403 shows correct message, storage errors surface. US2 complete.

---

## Phase 5: US3 — Service Worker Badge Clearing Is Reliable (P2)

**Goal**: Badges set by `showSuccessBadge` and `showErrorBadge` clear durably within 1 minute even if the service worker is terminated and restarted.

**Independent Test**: Set a badge, simulate service worker termination by reloading the extension, verify the badge still clears via the alarm.

### Tests for User Story 3 (TDD — write first, confirm failing, then implement)

- [x] T036 [US3] Add `chrome.alarms` mock (`create`, `onAlarm.addListener`) and `chrome.storage.session` mock to `tests/setup.ts`
- [x] T037 [US3] Write failing test — `showSuccessBadge()` calls `chrome.alarms.create('clear-badge', ...)` and `chrome.storage.session.set({ pendingBadgeClear: ... })` in `tests/unit/service-worker.test.ts` (create new file)
- [x] T038 [P] [US3] Write failing test — `showErrorBadge()` calls `chrome.alarms.create('clear-badge', ...)` and `chrome.storage.session.set` in `tests/unit/service-worker.test.ts`
- [x] T039 [US3] Write failing test — alarm `'clear-badge'` handler reads `pendingBadgeClear` from session storage, calls `chrome.action.setBadgeText({ text: '' })`, and removes the session entry in `tests/unit/service-worker.test.ts`

### Implementation for User Story 3

- [x] T040 [US3] Replace `setTimeout` in `showSuccessBadge` in `src/background/service-worker.ts` — write `chrome.storage.session.set({ pendingBadgeClear: { tabId } })` then `chrome.alarms.create('clear-badge', { when: Date.now() + 2000 })` (makes T037 pass)
- [x] T041 [P] [US3] Replace `setTimeout` in `showErrorBadge` in `src/background/service-worker.ts` — same pattern with 3000ms delay (makes T038 pass)
- [x] T042 [US3] Add `chrome.alarms.onAlarm.addListener` handler in `src/background/service-worker.ts` — on alarm name `'clear-badge'`: read `pendingBadgeClear`, call `chrome.action.setBadgeText({ text: '', tabId })`, then `chrome.storage.session.remove('pendingBadgeClear')` (makes T039 pass)
- [x] T043 [US3] Fix `onMessage` listener in `src/background/service-worker.ts` — add `if (sender.id !== chrome.runtime.id) return false` guard; type `message` parameter as `ExtensionMessage`; change `return true` to `return false` (responses are synchronous)
- [x] T044 [P] [US3] Remove redundant `export {}` at end of `src/background/service-worker.ts` (file already has named exports)

**Checkpoint**: Badges clear reliably via chrome.alarms. US3 complete.

---

## Phase 6: US4 — Popup Shows Dedicated Sign-In State (P2)

**Goal**: First-time and re-auth users see a "Sign In with Google" button, not a generic red error with a useless Retry button.

**Independent Test**: Open the popup with no cached token. Verify the auth container appears with a Sign In button. Click it and verify the OAuth flow starts.

### Tests for User Story 4 (TDD — write first, confirm failing, then implement)

- [x] T045 [US4] Write failing test — popup `showAuth()` state shows `#auth-container` and hides status/error/success containers in `tests/unit/popup.test.ts`
- [x] T046 [P] [US4] Write failing test — `createTask()` calls `showAuth()` when error has `code === 'AUTH_REQUIRED'` in `tests/unit/popup.test.ts`
- [x] T047 [P] [US4] Write failing test — sign-in button click triggers `createTask()` flow in `tests/unit/popup.test.ts`

### Implementation for User Story 4

- [x] T048 [US4] Add `#auth-container` to `src/popup/popup.html` — insert `<div id="auth-container" class="auth-container hidden"><p class="auth-message">Sign in to create tasks.</p><button id="sign-in-button" class="sign-in-button" aria-label="Sign in with Google">Sign In with Google</button></div>` after `#error-container`
- [x] T049 [US4] Add `authContainer` and `signInButton` element refs to `src/popup/popup.ts` `initElements()`; add `showAuth()` function that shows `#auth-container` and hides other states (makes T045 pass)
- [x] T050 [US4] Update `createTask()` catch block in `src/popup/popup.ts` — call `showAuth()` when `isAppError(error) && error.code === 'AUTH_REQUIRED'` instead of calling `showError()` (makes T046 pass)
- [x] T051 [US4] Wire sign-in button in `src/popup/popup.ts` `init()` — `signInButton?.addEventListener('click', () => createTask())` (makes T047 pass)
- [x] T052 [US4] Add `.auth-container` and `.sign-in-button` styles to `src/popup/popup.css` — match the existing button styles; add `:focus-visible` outline

**Checkpoint**: Unauthenticated users see a Sign In button. US4 complete.

---

## Phase 7: US5 — Extension Meets WCAG 2.1 AA (P2)

**Goal**: All text meets 4.5:1 contrast, all buttons have visible focus indicators, state changes are announced to screen readers, animations respect reduced-motion.

**Independent Test**: Tab through the popup with keyboard only (all interactive elements reachable); run axe DevTools on the popup and options page; verify zero AA violations.

### Implementation for User Story 5

*(Accessibility changes are primarily HTML/CSS — no TDD pairing needed for ARIA attributes)*

- [x] T053 [P] [US5] Fix contrast colours in `src/popup/popup.css` — `.error-message { color: #c5221f }` (was `#ea4335`); `.success-message { color: #137333 }` (was `#34a853`); `.status-message { color: #5f6368 }` (was `#666`)
- [x] T054 [P] [US5] Add `:focus-visible` styles in `src/popup/popup.css` — `.retry-button:focus-visible, .sign-in-button:focus-visible { outline: 2px solid #4285f4; outline-offset: 2px; }`
- [x] T055 [P] [US5] Add reduced-motion rule in `src/popup/popup.css` — `@media (prefers-reduced-motion: reduce) { .status-icon { animation: none; } }`
- [x] T056 [P] [US5] Update `src/popup/popup.html` — add `role="status"` and `aria-live="polite"` to `<div id="status">`; add `aria-hidden="true"` to `<div id="status-icon">`; add `aria-hidden="true"` to `<div class="success-icon">`; add `aria-label="Retry creating task"` to `#retry-button`
- [x] T057 [P] [US5] Add `:focus-visible` styles in `src/options/options.css` — `.button:focus-visible { outline: 2px solid #4285f4; outline-offset: 2px; }`
- [x] T058 [P] [US5] Add reduced-motion rule in `src/options/options.css` — `@media (prefers-reduced-motion: reduce) { .spinner { animation: none; } }`
- [x] T059 [P] [US5] Update `src/options/options.html` — add `aria-hidden="true"` to spinner `<div>`; add `role="status"` and `aria-live="polite"` to status message container; add descriptive `aria-label` to Refresh and Save buttons

**Checkpoint**: Extension passes WCAG 2.1 AA automated checks. US5 complete.

---

## Phase 8: US6 — Test Suite Is Reliable, Complete, and Enforces Coverage (P3)

**Goal**: 80% coverage enforced, popup/options/service-worker each ≥80%, no flaky timestamp tests, shared helpers eliminate duplication.

**Independent Test**: Run `npm run test:ci` — exits 0 with all 100+ tests passing and coverage thresholds met.

### Tests for User Story 6

- [x] T060 [US6] Add coverage `thresholds` to `vitest.config.ts` — `statements: 80, branches: 80, functions: 80, lines: 80, perFile: true`; update `include` in tsconfig reference to use `tsconfig.test.json`
- [x] T061 [US6] Export `DEFAULT_MOCK_TOKEN = 'mock-auth-token-12345'` from `tests/setup.ts`; export `createMockTab(overrides?: Partial<chrome.tabs.Tab>): chrome.tabs.Tab` factory with sensible defaults (`id: 1, url: 'https://example.com', title: 'Example Page', active: true, ...`)
- [x] T062 [US6] Add `onMessage` event-firing helper to `tests/setup.ts` — store the registered `onMessage` listener; export `triggerMessage(msg: ExtensionMessage)` helper that calls the stored listener
- [x] T063 [US6] Add `vi.useFakeTimers()` / `vi.setSystemTime(new Date('2026-01-01'))` in `beforeEach` and `vi.useRealTimers()` in `afterEach` to timestamp-sensitive tests in `tests/unit/storage.test.ts`
- [x] T064 [P] [US6] Add `chrome.runtime.lastError` failure test cases to `tests/unit/storage.test.ts` — verify `setPreferences` and `setCachedLists` reject when `lastError` is set (verifies T026 implementation)
- [x] T065 [P] [US6] Expand `tests/unit/popup.test.ts` — add tests for all popup states (loading, success, error, auth), `getErrorMessage` for all 9 error codes, auto-close `setTimeout` via fake timers, `handleRetry` async behavior; this file was started in T020
- [x] T066 [P] [US6] Expand `tests/unit/service-worker.test.ts` — add `onMessage` handler tests (TASK_CREATED, TASK_ERROR, unknown sender), badge text/color assertions; this file was started in T037–T039
- [x] T067 [P] [US6] Create `tests/unit/options.test.ts` — tests for `loadData` (loading state, populates dropdown, cache miss, deleted-list fallback), `savePreference` (writes storage, success message), sign-in state on `AUTH_REQUIRED`
- [x] T068 [P] [US6] Expand `tests/unit/tasks-api.test.ts` — add Authorization header assertion on `createTask` calls; add 5xx → `API_ERROR` with `retryable: true` test; verify `getTaskLists` URL includes `maxResults=100`
- [x] T069 [P] [US6] Add 401 token-refresh integration test to `tests/integration/task-creation.test.ts` — mock first `createTask` returning 401, second succeeding; assert `removeToken` was called and task was created
- [x] T070 [P] [US6] Add `Authorization: Bearer` header assertion to "Full user flow" test in `tests/integration/task-creation.test.ts`

### Structural cleanup

- [x] T071 [P] [US6] Merge `tests/unit/task-lists.test.ts` into `tests/unit/tasks-api.test.ts` — move all tests, delete `task-lists.test.ts`
- [x] T072 [P] [US6] Merge `tests/unit/list-selection.test.ts` into `tests/unit/storage.test.ts` — move all tests, delete `list-selection.test.ts`
- [x] T073 [P] [US6] Replace all inline tab object literals with `createMockTab()` in `tests/unit/page-capture.test.ts` (7 occurrences)
- [x] T074 [P] [US6] Replace all inline tab object literals with `createMockTab()` in `tests/integration/task-creation.test.ts` (2 occurrences)
- [x] T075 [P] [US6] Replace hardcoded `'mock-auth-token-12345'` with imported `DEFAULT_MOCK_TOKEN` in `tests/unit/auth.test.ts`, `tests/integration/auth-flow.test.ts`, `tests/integration/task-creation.test.ts`
- [x] T076 [US6] Add whitespace-only title test to `tests/unit/page-capture.test.ts` — `title: '   '` should trigger domain fallback (boundary case for `extractPageInfo`)

**Checkpoint**: `npm run test:ci` exits 0 with ≥80% coverage on all files. US6 complete.

---

## Phase 9: Polish & Cross-Cutting Concerns

- [x] T077 Update `CLAUDE.md` in repo root — add ESLint 9.x + `@typescript-eslint`, `chrome.alarms`, and `chrome.storage.session` to Active Technologies section for feature 002
- [x] T078 [P] Run full pipeline verification: `npm run build && npm run type-check && npm run lint && npm run test:ci` — all must exit 0
- [ ] T079 [P] Load unpacked extension in Chrome (Developer mode) and manually verify: task creation succeeds, expired-token path shows Sign In button, badge appears and clears, offline path shows network error message
- [ ] T080 [P] Run Lighthouse accessibility audit on the options page — verify zero WCAG AA violations in the automated report

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)           → No dependencies — start immediately
Phase 2 (Foundation)      → Requires Phase 1 complete (tsconfig must be valid before tsc can parse types)
Phase 3 (US1)             → Requires Phase 1 + npm install (T007)
Phase 4 (US2)             → Requires Phase 2 complete (types import in tests)
Phase 5 (US3)             → Requires Phase 2 + T036 (alarms mock in setup.ts)
Phase 6 (US4)             → Requires Phase 4 (AUTH_REQUIRED from task-creation retry loop)
Phase 7 (US5)             → Requires Phase 1 (build must work); otherwise independent
Phase 8 (US6)             → Requires Phase 5 (service-worker tests need alarms mock from T036)
Phase 9 (Polish)          → Requires all phases complete
```

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 1 complete — no other story dependencies
- **US2 (P1)**: Depends on Phase 2 (T006 type changes) — independent of US1 except build must work
- **US3 (P2)**: Depends on Phase 2 (ExtensionMessage type) and T036 (setup.ts alarms mock)
- **US4 (P2)**: Depends on US2 (the 401 retry loop in task-creation.ts must exist for auth state to be meaningful)
- **US5 (P2)**: Independent — only touches HTML/CSS, no cross-story dependencies
- **US6 (P3)**: Depends on US3 (alarms mock must exist) and benefits from all prior stories being implemented

### Within Each User Story (TDD Cycle)

1. Write ALL failing tests for the story (mark [TDD] tasks)
2. Run `npm test` — confirm new tests fail, existing tests still pass
3. Implement fixes in order (sequential within story, parallel where marked [P])
4. Run `npm test` — confirm all tests pass
5. Commit

### Parallel Opportunities Per Story

**US2 tests (T011–T020)**: T012, T013, T014, T015 can all be written in parallel (different it() blocks in same file)

**US2 implementation (T021–T035)**: T022, T023, T024, T025 are independent changes to different functions in `tasks-api.ts` — can be done together; T032, T033, T034, T035 are independent changes in `popup.ts` and `options.ts` — can be done together

**US3 (T037–T044)**: T037 and T038 can be written in parallel; T040 and T041 can be implemented in parallel

**US5 (T053–T059)**: All 7 tasks are independent HTML/CSS edits across 4 files — fully parallelizable

**US6 cleanup (T071–T076)**: All 6 structural cleanup tasks touch different files — fully parallelizable

---

## Parallel Example: US2 Tests

```text
# Write all failing tests for US2 in parallel (different describe blocks, same file):
Task T011: TasksAPIError constructor message test
Task T012: 403 → PERMISSION_DENIED test
Task T013: encodeURIComponent in URL test
Task T014: malformed JSON → API_ERROR test
Task T015: maxResults=100 in URL test

# Then confirm all 5 fail before starting implementation
```

## Parallel Example: US5 Accessibility

```text
# All 7 accessibility tasks touch different files — run in parallel:
Task T053: popup.css contrast colours
Task T054: popup.css focus-visible
Task T055: popup.css prefers-reduced-motion
Task T056: popup.html ARIA attributes
Task T057: options.css focus-visible
Task T058: options.css prefers-reduced-motion
Task T059: options.html ARIA attributes
```

---

## Implementation Strategy

### MVP First (US1 + US2 — Both P1)

1. Complete Phase 1: Setup (T001–T005)
2. Run `npm install` (T007)
3. Complete Phase 2: Foundation types (T006)
4. Verify build pipeline (T008–T010) → **US1 complete**
5. Write US2 failing tests (T011–T020)
6. Implement US2 fixes (T021–T035) → **US2 complete**
7. **STOP and VALIDATE**: Build works, runtime bugs fixed, token refresh works
8. Deploy/demo if ready

### Incremental Delivery

1. Phase 1–3 → Build toolchain green (**US1**)
2. Phase 4 → Runtime bugs fixed (**US2**)
3. Phase 5–6 → Badge and auth UX (**US3 + US4**)
4. Phase 7 → Accessibility (**US5**)
5. Phase 8 → Test quality enforcement (**US6**)
6. Each phase delivers independently verifiable value

### Parallel Team Strategy (2 developers)

After Phase 1–3 complete:
- **Dev A**: US2 (runtime bugs in services/) + US3 (service worker)
- **Dev B**: US4 (popup auth state) + US5 (accessibility HTML/CSS)
- Both converge on US6 (test quality) once their stories are done

---

## Summary

| Phase | Story | Tasks | Parallel |
|---|---|---|---|
| 1 Setup | — | T001–T005 (5) | T004, T005 |
| 2 Foundation | — | T006 (1) | — |
| 3 Build | US1 | T007–T010 (4) | — |
| 4 Runtime Bugs | US2 | T011–T035 (25) | T012–T015, T022–T025, T032–T035 |
| 5 Badge Clearing | US3 | T036–T044 (9) | T038, T041, T044 |
| 6 Auth Popup | US4 | T045–T052 (8) | T046–T047 |
| 7 Accessibility | US5 | T053–T059 (7) | All 7 |
| 8 Test Quality | US6 | T060–T076 (17) | T064–T076 |
| 9 Polish | — | T077–T080 (4) | T078–T080 |
| **Total** | | **80 tasks** | **~35 parallelizable** |

## Notes

- `[P]` tasks operate on different files or independent blocks — safe to execute in parallel
- Every implementation task in US2–US4 is paired with a test task that must fail first
- US5 tasks are HTML/CSS only — no TDD pair needed, verify with axe/Lighthouse
- US6 tasks are test infrastructure improvements — run `npm run test:ci` at the end to confirm ≥80% coverage
- Commit after each completed user story phase checkpoint
- The `dist/` directory is gitignored — rebuild after each code change to verify the extension loads
