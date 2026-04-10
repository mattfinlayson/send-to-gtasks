# Tasks: Enhance Task Saving

**Input**: Design documents from `/specs/006-enhance-task-saving/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Add new types and storage keys for enhanced features

- [X] T001 [P] Add QueuedTask and OfflineQueue types to src/types/index.ts
- [X] T002 [P] Add OfflineQueue storage keys to src/services/storage.ts (getOfflineQueue, setOfflineQueue, enqueueTask, dequeueTask)
- [X] T003 [P] Add SavedUrlIndex storage keys to src/services/storage.ts (getSavedUrls, addSavedUrl)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure for all user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 [P] Extend TaskSaveForm interface in src/types/index.ts to include notes and dueDate fields
- [X] T005 [P] Add ToastNotification types to src/types/index.ts (success, error, queued, duplicate)
- [X] T006 Create offline-queue.ts service in src/services/offline-queue.ts
- [X] T007 [P] Create duplicate-check.ts service in src/services/duplicate-check.ts
- [X] T008 [P] Add dark mode CSS variables to src/popup/popup.css and src/options/options.css

---

## Phase 3: User Story 1 - Add Notes to Saved Tasks (Priority: P1) 🎯 MVP

**Goal**: Users can add text notes to tasks before saving

**Independent Test**: Save a page with a note → verify note appears in Google Tasks

### Tests for User Story 1

> **TDD: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T009 [P] [US1] Test task creation with notes field in tests/unit/task-creation.test.ts
- [ ] T010 [P] [US1] Test notes truncation at 1024 chars in tests/unit/task-creation.test.ts

### Implementation for User Story 1

- [X] T011 [P] [US1] Add notes textarea to src/popup/popup.html with id="notes-input"
- [X] T012 [P] [US1] Add notes field styling to src/popup/popup.css
- [X] T013 [US1] Handle notes field in src/popup/popup.ts, pass to createTask()
- [X] T014 [US1] Update createTask() in src/services/task-creation.ts to include notes in API call
- [X] T015 [US1] Add notes to saved URL index in src/services/storage.ts

---

## Phase 4: User Story 2 - Due Date Selection (Priority: P2)

**Goal**: Users can set a due date when saving tasks

**Independent Test**: Save a page with due date → verify date set in Google Tasks

### Tests for User Story 2

- [ ] T016 [P] [US2] Test due date validation (today to +5 years) in tests/unit/task-creation.test.ts
- [ ] T017 [P] [US2] Test past date warning behavior in tests/unit/task-creation.test.ts

### Implementation for User Story 2

- [X] T018 [P] [US2] Add due date picker to src/popup/popup.html with id="due-date-picker"
- [X] T019 [P] [US2] Add due date picker styling to src/popup/popup.css
- [X] T020 [US2] Handle due date field in src/popup/popup.ts, validate range
- [X] T021 [US2] Update createTask() in src/services/task-creation.ts to include due date (RFC 3339 format)
- [X] T022 [US2] Show warning when past date selected (but allow save)

---

## Phase 5: User Story 3 - Better Notifications (Priority: P1)

**Goal**: Clear success/error notifications with retry option

**Independent Test**: Save task → see success toast with title. Simulate error → see error toast with retry.

### Tests for User Story 3

- [ ] T023 [P] [US3] Test toast notification display in tests/unit/toast.test.ts
- [ ] T024 [P] [US3] Test error toast with retry action in tests/unit/toast.test.ts
- [ ] T025 [P] [US3] Test queued notification in tests/unit/toast.test.ts

### Implementation for User Story 3

- [X] T026 [P] [US3] Extend src/popup/toast.html to support success/error/queued types
- [X] T027 [P] [US3] Extend src/popup/toast.ts to handle notification types and retry action
- [ ] T028 [US3] Update src/popup/popup.ts to show success toast after task creation
- [ ] T029 [US3] Update error handling in src/services/task-creation.ts to show error toast with retry
- [ ] T030 [US3] Add queued notification when task saved offline

---

## Phase 6: User Story 4 - Offline Queue (Priority: P2)

**Goal**: Queue tasks when offline, sync when back online

**Independent Test**: Go offline → save task → verify queued. Go online → verify auto-sync.

### Tests for User Story 4

- [ ] T031 [P] [US4] Test offline queue enqueue/dequeue in tests/unit/offline-queue.test.ts
- [ ] T032 [P] [US4] Test queue retry logic (3 attempts, 24h expiry) in tests/unit/offline-queue.test.ts
- [ ] T033 [P] [US4] Test queue sync on alarm trigger in tests/unit/offline-queue.test.ts

### Implementation for User Story 4

- [ ] T034 [P] [US4] Implement syncOfflineQueue() in src/services/offline-queue.ts
- [ ] T035 [P] [US4] Implement queue cleanup (discard after 24h) in src/services/offline-queue.ts
- [ ] T036 [US4] Add chrome.alarms.create() for periodic queue sync in src/background/service-worker.ts
- [ ] T037 [US4] Handle alarm.onAlarm listener in src/background/service-worker.ts
- [ ] T038 [US4] Update task-creation.ts to enqueue on API failure
- [ ] T039 [US4] Show pending count in popup UI
- [ ] T040 [US4] Add queue initialization on extension install/update in service-worker.ts

---

## Phase 7: User Story 5 - Duplicate Detection (Priority: P3)

**Goal**: Warn users when saving a duplicate URL

**Independent Test**: Save URL → attempt to save same URL → see warning dialog

### Tests for User Story 5

- [ ] T041 [P] [US5] Test duplicate detection in tests/unit/duplicate-check.test.ts
- [ ] T042 [P] [US5] Test URL normalization in tests/unit/duplicate-check.test.ts
- [ ] T043 [P] [US5] Test duplicate check includes pending queue in tests/unit/duplicate-check.test.ts

### Implementation for User Story 5

- [ ] T044 [P] [US5] Implement checkDuplicate() in src/services/duplicate-check.ts
- [ ] T045 [P] [US5] Add duplicate warning UI to src/popup/popup.html
- [ ] T046 [US5] Integrate duplicate check in src/popup/popup.ts before save
- [ ] T047 [US5] Handle "Save Anyway" and "Cancel" actions in duplicate dialog

---

## Phase 8: User Story 6 - Dark Mode (Priority: P3)

**Goal**: Popup and options page follow system dark mode preference

**Independent Test**: Toggle system dark mode → verify UI updates

### Tests for User Story 6

- [ ] T048 [P] [US6] Test dark mode CSS in tests/unit/popup.test.ts (if applicable)

### Implementation for User Story 6

- [ ] T049 [P] [US6] Add prefers-color-scheme media query to src/popup/popup.css
- [ ] T050 [P] [US6] Add prefers-color-scheme media query to src/options/options.css
- [ ] T051 [US6] Test dark mode styles for notes textarea and due date picker

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup and edge case handling

- [ ] T052 [P] Update quickstart.md with new fields and features
- [ ] T053 [P] Run npm run check and fix any linting issues
- [ ] T054 [P] Verify all tests pass with npm run test
- [ ] T055 Test edge cases: note truncation, future date cap, mid-sync connectivity loss
- [ ] T056 Test storage cleanup on extension update

---

## Dependencies & Execution Order

### Phase Dependencies

| Phase | Depends On | Blocks |
|-------|------------|--------|
| Setup (Phase 1) | None | Foundational |
| Foundational (Phase 2) | Setup | All user stories |
| US1 (Phase 3) | Foundational | US1 tests |
| US2 (Phase 4) | Foundational | US2 tests |
| US3 (Phase 5) | Foundational | US3 tests |
| US4 (Phase 6) | Foundational | US4 tests |
| US5 (Phase 7) | Foundational | US5 tests |
| US6 (Phase 8) | Foundational | US6 tests |
| Polish (Phase 9) | All stories | None |

### User Story Independence

- **US1, US2, US3**: All build on Foundational → can implement in parallel
- **US4**: Builds on Foundational → uses notes/dueDate from US1/US2
- **US5**: Builds on Foundational → checks URLs including queue
- **US6**: Pure UI → independent of all others

### Parallel Opportunities

- All tasks marked [P] within a phase can run in parallel
- US1, US2, US3 can start simultaneously after Foundational
- US4, US5, US6 can start simultaneously after Foundational

---

## Implementation Strategy

### MVP First (US1 + US3)

1. Complete Phase 1-2 → Foundation ready
2. Complete Phase 3 (US1 - Notes)
3. Complete Phase 5 (US3 - Notifications)
4. **Test and deploy MVP**

### Incremental Delivery

| Increment | Stories | Value |
|----------|---------|-------|
| MVP | US1 + US3 | Notes + better notifications |
| v1.1 | US2 | Add due dates |
| v1.2 | US4 | Add offline queue |
| v1.3 | US5 + US6 | Duplicate detection + dark mode |

---

## Summary

| Metric | Count |
|--------|-------|
| **Total Tasks** | 56 |
| **Setup** | 3 |
| **Foundational** | 5 |
| **US1 (Notes)** | 7 |
| **US2 (Due Date)** | 7 |
| **US3 (Notifications)** | 8 |
| **US4 (Offline Queue)** | 9 |
| **US5 (Duplicate)** | 7 |
| **US6 (Dark Mode)** | 4 |
| **Polish** | 5 |
| **Parallelizable** | 35 (62%) |

**Recommended Start**: Phase 1-2 → then US1 + US3 (MVP)
