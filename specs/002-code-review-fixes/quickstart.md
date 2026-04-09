# Quickstart: Code Review Fixes

**Feature**: 002-code-review-fixes
**Branch**: `002-code-review-fixes`

---

## Prerequisites

- Node.js 20+
- npm 10+
- Chrome or Chromium browser

---

## Setup

```bash
git checkout 002-code-review-fixes
npm install
```

The first thing this feature does is fix the broken build and lint toolchain. After the build fixes are applied, verify the setup with:

```bash
npm run build        # Should complete without errors
npm run type-check   # Should complete without errors
npm run lint         # Should complete without errors
npm test             # Should run 64+ tests, all passing
```

---

## Development Workflow

Follow TDD strictly per the project constitution:

1. **Write a failing test** that covers the behaviour you are fixing
2. Run `npm test` and confirm the new test fails (red)
3. **Implement the fix** with minimum code to make the test pass
4. Run `npm test` and confirm all tests pass (green)
5. Refactor if needed while keeping tests green

### Watch Mode

```bash
npm run test:watch        # Vitest in watch mode — re-runs on file changes
```

### Coverage

```bash
npm run test:coverage     # Full coverage report (HTML in coverage/)
npm run test:ci           # Coverage with enforcement (fails below 80%)
```

---

## Key Files by Workstream

### A: Build Tooling
| File | Change |
|---|---|
| `vite.config.ts` | `minify: 'terser'` → `minify: 'esbuild'`; remove `emptyDirBeforeWrite` |
| `package.json` | Add `eslint`, `@typescript-eslint/*`; remove `vitest-chrome`; add `test:ci`, `type-check` scripts |
| `tsconfig.json` | Remove `rootDir: "./src"`; remove `vitest/globals` from types |
| `tsconfig.test.json` | New file — extends base, adds `vitest/globals`, covers tests |
| `eslint.config.js` | New ESLint flat config |

### B: Runtime Bug Fixes
| File | Change |
|---|---|
| `src/types/index.ts` | Add `PERMISSION_DENIED` to `AppError.code`; add `ExtensionMessage` type; add `isAppError` predicate; remove `Task`, `StorageSchema`, `GoogleAPIError` |
| `src/services/tasks-api.ts` | Fix `super(code)` → `super(message)`; split 403 from 429; `encodeURIComponent(listId)`; typed `response.json()`; malformed JSON catch |
| `src/services/storage.ts` | Add `chrome.runtime.lastError` checks to all 4 Promise wrappers |
| `src/services/task-creation.ts` | 401 retry loop; throw `TasksAPIError` (not `Error`) for null token; validate notes length |
| `src/popup/popup.ts` | Auth state; fix `handleRetry` async; use `isAppError`; handle `PERMISSION_DENIED` |
| `src/popup/popup.html` | Add `#auth-container` with Sign In button |
| `src/background/service-worker.ts` | `chrome.alarms` badge clearing; typed messages; fix `return true` |

### C: Accessibility
| File | Change |
|---|---|
| `src/popup/popup.css` | Fix contrast colours; add `:focus-visible`; add `prefers-reduced-motion` |
| `src/popup/popup.html` | `role="status"` + `aria-live`; `aria-hidden` on decorative elements; `aria-label` on buttons |
| `src/options/options.css` | Add `:focus-visible`; add `prefers-reduced-motion` |
| `src/options/options.html` | ARIA improvements matching popup |

### D: Test Quality
| File | Change |
|---|---|
| `vitest.config.ts` | Add 80% coverage thresholds |
| `tests/setup.ts` | Export `DEFAULT_MOCK_TOKEN`; add `createMockTab()`; fix `onMessage` event firing |
| `tests/unit/storage.test.ts` | Add `vi.useFakeTimers()` |
| `tests/unit/popup.test.ts` | New — covers `getErrorMessage`, state transitions, auth state |
| `tests/unit/service-worker.test.ts` | New — covers message handler, badge functions, alarm |
| `tests/unit/options.test.ts` | New — covers `loadData`, `savePreference`, deleted-list fallback |
| `tests/unit/tasks-api.test.ts` | Add 403/`PERMISSION_DENIED`, 5xx, malformed JSON tests; absorb `task-lists.test.ts` |
| `tests/unit/storage.test.ts` | Absorb `list-selection.test.ts`; replace inline tabs with `createMockTab()` |
| `tests/integration/task-creation.test.ts` | Add 401-retry test; add Authorization header assertion |

---

## Verifying Fixes

### Build toolchain
```bash
npm run build && npm run type-check && npm run lint
# All three should exit 0
```

### Runtime fixes
Load the unpacked extension in `chrome://extensions` (Developer mode). Test:
- Open a page, click the extension icon → task should be created
- Sign out of Google (revoke token in chrome://settings) → popup should show Sign In button
- Try creating a task while offline → should show "Unable to connect" message

### Accessibility
Use Chrome DevTools → Accessibility tab to verify:
- All buttons have accessible names
- Focus order is logical when tabbing through the popup
- Run Lighthouse accessibility audit on the options page

### Test coverage
```bash
npm run test:ci   # Should pass with ≥80% coverage
```

---

## Commit Guidance

Follow the TDD cycle: one commit per fixed bug or test addition, keeping tests green. Do not batch unrelated fixes into a single commit.
