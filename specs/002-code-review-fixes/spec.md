# Feature Specification: Code Review Fixes

**Feature Branch**: `002-code-review-fixes`
**Created**: 2026-04-08
**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Extension Builds and Lints Without Errors (Priority: P1)

A developer running `npm run build` or `npm run lint` should get a clean result with no missing dependencies or configuration errors. Currently the build fails because `terser` is not installed, the lint script references `eslint` which is not in devDependencies, and the TypeScript config causes `tsc` to error.

**Why this priority**: A broken build pipeline blocks every other fix. No other work can be verified or shipped until the toolchain is healthy.

**Independent Test**: Can be fully tested by running `npm run build`, `npm run lint`, and `npm run type-check` and verifying each exits with code 0.

**Acceptance Scenarios**:

1. **Given** a clean checkout, **When** `npm run build` is run, **Then** it completes without errors and produces output in `dist/`.
2. **Given** the source files, **When** `npm run lint` is run, **Then** it exits cleanly with no missing-dependency errors.
3. **Given** the source files, **When** `npm run type-check` is run, **Then** TypeScript reports no errors across both `src/` and `tests/`.

---

### User Story 2 - Runtime Bugs Are Fixed and Extension Behaves Correctly (Priority: P1)

Users of the extension encounter silent failures: expired OAuth tokens are never refreshed, storage errors are swallowed, errors in the retry path are silently lost, and HTTP 403 responses display the wrong error message. These bugs cause user-visible failures that are hard to diagnose. After this fix, the extension handles all these cases correctly.

**Why this priority**: These are correctness regressions — the extension may silently fail to create tasks or show misleading error messages, directly harming user trust.

**Independent Test**: Can be tested by exercising the error paths in the extension: expiring a token, triggering a 403 (wrong scope), and confirming the correct messages and behaviours result.

**Acceptance Scenarios**:

1. **Given** a user whose OAuth token has expired, **When** they click the extension icon, **Then** the expired token is invalidated, a new token is requested, and the task is created without requiring a manual retry.
2. **Given** the Google API returns a 403 (insufficient scope), **When** the extension processes the response, **Then** the user sees a message indicating a permission or authorization problem — not "Too many requests."
3. **Given** a user clicks Retry after an error, **When** the retry fails, **Then** the error is surfaced to the user rather than silently swallowed.
4. **Given** a storage write fails (e.g., quota exceeded), **When** the extension attempts to save preferences, **Then** the failure is reported rather than silently resolved.

---

### User Story 3 - Service Worker Badge Clearing Is Reliable (Priority: P2)

The badge showing success (✓) or error (!) on the extension icon is cleared after a few seconds. Currently this uses `setTimeout`, which is not durable in a Manifest V3 service worker — the badge may never clear if the service worker is terminated. After this fix, badges are cleared reliably even if the service worker restarts.

**Why this priority**: A stuck badge misleads users about the state of the last task creation. It is a reliability issue rather than a data loss issue, so it is P2.

**Independent Test**: Can be tested by creating a task, waiting for the badge to appear, then verifying the badge clears after the expected interval even when the service worker is restarted between badge set and clear.

**Acceptance Scenarios**:

1. **Given** a task is successfully created, **When** the success badge appears, **Then** the badge is cleared within 3 seconds even if the service worker restarts.
2. **Given** a task creation fails, **When** the error badge appears, **Then** the badge is cleared within 4 seconds even if the service worker restarts.

---

### User Story 4 - Popup Shows a Dedicated Sign-In State for Unauthenticated Users (Priority: P2)

When a first-time user or a user with a revoked token opens the popup, they currently see a generic red error box with a "Retry" button that cannot succeed without authentication. After this fix, they see a clear sign-in prompt with a functional "Sign In with Google" button.

**Why this priority**: First-time user experience is critical for adoption. A red error with an unusable Retry button is a UX dead end.

**Independent Test**: Can be tested by opening the extension with no cached token and verifying a Sign In button appears that, when clicked, initiates the OAuth flow.

**Acceptance Scenarios**:

1. **Given** no cached OAuth token exists, **When** the popup opens, **Then** a "Sign In with Google" button is shown instead of a generic error message.
2. **Given** the Sign In button is shown, **When** the user clicks it, **Then** the OAuth consent flow is initiated interactively.
3. **Given** sign-in succeeds, **When** the OAuth flow completes, **Then** the popup proceeds to create the task automatically.

---

### User Story 5 - Extension Meets WCAG 2.1 AA Accessibility Standards (Priority: P2)

Keyboard and screen reader users cannot currently use the extension: buttons have no visible focus indicator, error and success states are not announced to assistive technology, and several text colours fail contrast requirements. After this fix, the extension passes WCAG 2.1 AA.

**Why this priority**: Accessibility is a baseline quality requirement. The specific violations (no focus indicator, no ARIA live regions, failing contrast) are failures at the AA level.

**Independent Test**: Can be tested by navigating the popup and options page with keyboard only, running a screen reader, and verifying contrast ratios using a colour contrast checker.

**Acceptance Scenarios**:

1. **Given** a keyboard user, **When** they tab through the popup, **Then** every interactive element has a clearly visible focus indicator.
2. **Given** a screen reader user, **When** the popup transitions between loading, success, and error states, **Then** each state change is announced.
3. **Given** any text in the popup or options page, **When** measured against its background, **Then** the contrast ratio meets or exceeds 4.5:1 for normal-sized text.
4. **Given** a user with reduced-motion preferences enabled, **When** the loading spinner is shown, **Then** the spinning animation is suppressed.

---

### User Story 6 - Test Suite Is Reliable, Complete, and Enforces Coverage (Priority: P3)

The test suite currently has 0% coverage on three source files (popup, options, service worker), no coverage thresholds, flaky timestamp tests, and several structural issues (duplicate test file, repeated mock objects). After this fix, the suite is reliable in CI, enforces an 80% coverage minimum, and covers the previously untested UI layer.

**Why this priority**: Test quality improvements reduce future defect risk but do not block the extension from working today. They are foundational for long-term maintainability.

**Independent Test**: Can be tested by running `npm run test:ci` and verifying it exits cleanly, with coverage thresholds enforced and all tests passing deterministically across multiple runs.

**Acceptance Scenarios**:

1. **Given** the test suite, **When** `npm run test:ci` is run, **Then** it enforces an 80% minimum across statements, branches, functions, and lines.
2. **Given** the test suite, **When** run 10 times consecutively, **Then** results are identical each time (no flaky failures from timestamp comparisons).
3. **Given** `popup.ts`, `options.ts`, and `service-worker.ts`, **When** coverage is measured, **Then** each file has at least 80% statement coverage.
4. **Given** the test helper setup, **When** a test needs a mock tab, **Then** it uses a shared `createMockTab()` factory rather than repeating the full object literal.

---

### Edge Cases

- What happens when `getTaskLists` returns more than 20 results? The dropdown should not silently truncate — pagination should be handled or a `maxResults=100` parameter used.
- What happens when `listId` contains special characters? It must be URL-encoded before use in API path construction.
- What happens when the URL captured from the current tab exceeds `MAX_NOTES_LENGTH` (8192 chars)? The notes field should be validated and truncated before sending.
- What happens when a non-HTTP URL (e.g., `chrome://`, `file://`) is captured? The extension should either filter it out or show an appropriate message.
- What happens when `response.json()` throws on a malformed API response? The error must be caught and surfaced as a `TasksAPIError` rather than an unhandled rejection.

## Requirements *(mandatory)*

### Functional Requirements

**Build & Tooling**

- **FR-001**: The build system MUST complete successfully using only the declared dependencies.
- **FR-002**: The lint command MUST be runnable with all referenced tools present in `devDependencies`.
- **FR-003**: The TypeScript configuration MUST support type-checking across both `src/` and `tests/` without errors.
- **FR-004**: A `type-check` script MUST exist and run `tsc --noEmit` successfully.
- **FR-005**: Dead and unused development dependencies MUST be removed.

**Runtime Bug Fixes**

- **FR-006**: When the API returns a 401 response, the extension MUST invalidate the cached token, acquire a new one, and retry the API call once before surfacing an error.
- **FR-007**: The extension MUST distinguish between HTTP 403 (permission denied / insufficient scope) and HTTP 429 (rate limited) and show appropriate messages for each.
- **FR-008**: When a retry is initiated from the popup, any error from the retry attempt MUST be surfaced to the user.
- **FR-009**: All storage read and write operations MUST check for and handle storage failures rather than silently resolving.
- **FR-010**: Task list IDs MUST be URL-encoded before use in API URL path construction.
- **FR-011**: The URL captured as task notes MUST be validated against the maximum notes length and truncated if necessary.

**Service Worker Reliability**

- **FR-012**: Badge display and clearing MUST use a mechanism that survives service worker termination between the badge being set and cleared.

**Popup UX — Auth State**

- **FR-013**: When no valid authentication exists, the popup MUST display a dedicated sign-in prompt with a functional "Sign In with Google" button, not a generic error message.
- **FR-014**: After successful sign-in from the popup, task creation MUST proceed automatically without requiring the user to click again.

**Accessibility**

- **FR-015**: All interactive elements in the popup and options page MUST have a visible focus indicator when focused via keyboard.
- **FR-016**: All dynamic state changes (loading, success, error) in the popup and options page MUST be announced to assistive technology via appropriate ARIA roles and live regions.
- **FR-017**: All text in the popup and options page MUST meet a minimum contrast ratio of 4.5:1 against its background.
- **FR-018**: Spinner animations MUST respect the user's reduced-motion preference.

**Test Quality**

- **FR-019**: The test suite MUST enforce a minimum of 80% coverage across statements, branches, functions, and lines.
- **FR-020**: `popup.ts`, `options.ts`, and `service-worker.ts` MUST each have at least 80% statement coverage.
- **FR-021**: Timestamp-dependent tests MUST use fake timers to eliminate timing-related flakiness.
- **FR-022**: A shared mock tab factory MUST be used in place of repeated inline tab object literals across test files.
- **FR-023**: A `test:ci` script MUST exist that runs the full suite with coverage enforcement.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `npm run build`, `npm run lint`, and `npm run type-check` all complete without errors on a clean checkout.
- **SC-002**: A user with an expired token successfully creates a task without manual intervention — the token refresh and retry happen transparently.
- **SC-003**: A user who has not authenticated sees a "Sign In with Google" button in the popup, not an error message.
- **SC-004**: All text and interactive elements in the popup and options page pass WCAG 2.1 Level AA automated checks.
- **SC-005**: Running the test suite 10 times consecutively produces identical pass/fail results (zero flaky tests).
- **SC-006**: Overall test suite statement coverage is ≥ 80%, with `popup.ts`, `options.ts`, and `service-worker.ts` each ≥ 80%.
- **SC-007**: The extension icon badge clears reliably within the expected interval in all cases, including when the service worker was restarted.

## Assumptions

- The fix to badge clearing will use `chrome.alarms` with a short delay as a replacement for `setTimeout`. This is the standard MV3-compliant pattern.
- The 401 retry loop will attempt the token refresh and API call exactly once before surfacing an error to prevent infinite retry loops.
- The `maxResults=100` parameter will be added to `getTaskLists` as a pragmatic fix for the pagination gap. Full pagination (handling `nextPageToken`) is out of scope for this feature.
- Non-HTTP URL filtering (e.g., `chrome://`, `file://`) will show a user-friendly message rather than silently passing the URL to the API.
- The WCAG contrast fix in the popup error state will update `#ea4335` to `#c5221f` (consistent with the already-compliant options page).
- TypeScript test configuration will be split into a separate `tsconfig.test.json` to avoid polluting production source files with test globals.
- The `isAppError` type predicate will be extracted to `src/types/index.ts` and shared between `popup.ts` and `options.ts`.
