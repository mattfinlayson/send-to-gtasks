# Tasks: Send Page to Google Tasks

**Input**: Design documents from `/specs/001-send-page-to-gtask/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**TDD Required**: Per constitution Principle I, all tests MUST be written first, fail (red), then implementation proceeds (green).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create project directory structure per plan.md layout
- [x] T002 Initialize npm project with package.json (name: send-to-gtask, type: module)
- [x] T003 [P] Install TypeScript and configure tsconfig.json with strict mode
- [x] T004 [P] Install Vite and create vite.config.ts per research.md
- [x] T005 [P] Install Vitest, vitest-chrome, @vitest/coverage-v8 and create vitest.config.ts
- [x] T006 [P] Create tests/setup.ts with Chrome API mocks per research.md
- [x] T007 Create src/manifest.json with Manifest V3 config (permissions: activeTab, storage, identity)
- [x] T008 [P] Create src/types/index.ts with TypeScript interfaces from data-model.md
- [x] T009 [P] Create extension icons placeholder in src/icons/ (16, 48, 128 px)

**Checkpoint**: Project compiles, tests run (no tests yet), extension loads in Chrome

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests for Foundational Phase

- [x] T010 [P] Write unit test for storage service in tests/unit/storage.test.ts (get/set preferences, cache operations)
- [x] T011 Verify T010 tests FAIL (red phase) before proceeding

### Implementation for Foundational Phase

- [x] T012 Implement storage service in src/services/storage.ts (get/set preferences, get/set cached lists)
- [x] T013 Verify T010 tests PASS (green phase)

**Checkpoint**: Foundation ready - storage service working, user story implementation can begin

---

## Phase 3: User Story 2 - Google Account Authentication (Priority: P2)

**Goal**: Connect Google account to enable API access. **Note**: Implemented before US1 because authentication is required for task creation to work.

**Independent Test**: Install extension fresh, click icon, complete Google sign-in, verify account connected.

### Tests for User Story 2

- [x] T014 [P] [US2] Write unit test for auth service in tests/unit/auth.test.ts (getToken, removeToken, isAuthenticated)
- [x] T015 [P] [US2] Write integration test for auth flow in tests/integration/auth-flow.test.ts
- [x] T016 [US2] Verify T014, T015 tests FAIL (red phase) before proceeding

### Implementation for User Story 2

- [x] T017 [US2] Implement auth service in src/services/auth.ts (getToken with interactive option, removeToken, isAuthenticated check)
- [x] T018 [US2] Verify T014 tests PASS (green phase)
- [x] T019 [US2] Add OAuth2 client_id placeholder in src/manifest.json oauth2 section
- [x] T020 [US2] Verify T015 integration tests PASS

**Checkpoint**: Authentication works - user can sign in with Google, token obtained

---

## Phase 4: User Story 1 - One-Click Task Creation (Priority: P1) 🎯 MVP

**Goal**: Click extension icon → task created with page title and URL

**Independent Test**: Click extension icon on any webpage, verify task appears in Google Tasks with page title and URL.

### Tests for User Story 1

- [ ] T021 [P] [US1] Write unit test for tasks-api service in tests/unit/tasks-api.test.ts (createTask with title/notes, error handling for 401/403/404)
- [ ] T022 [P] [US1] Write unit test for page capture in tests/unit/page-capture.test.ts (get current tab URL/title, handle missing title, truncate long titles)
- [ ] T023 [P] [US1] Write integration test for task creation flow in tests/integration/task-creation.test.ts
- [ ] T024 [US1] Verify T021, T022, T023 tests FAIL (red phase) before proceeding

### Implementation for User Story 1

- [ ] T025 [US1] Implement tasks-api service in src/services/tasks-api.ts (createTask function with retry on 401)
- [ ] T026 [US1] Verify T021 tests PASS (green phase)
- [ ] T027 [US1] Implement page capture utility in src/services/page-capture.ts (getCurrentTab, extractPageInfo with title truncation)
- [ ] T028 [US1] Verify T022 tests PASS (green phase)
- [ ] T029 [US1] Create popup HTML structure in src/popup/popup.html (minimal: status indicator, error display)
- [ ] T030 [US1] Create popup styles in src/popup/popup.css (simple, <100 lines)
- [ ] T031 [US1] Implement popup logic in src/popup/popup.ts (on load: check auth, get tab info, create task, show result)
- [ ] T032 [US1] Implement service worker in src/background/service-worker.ts (handle action click, message passing)
- [ ] T033 [US1] Verify T023 integration tests PASS (green phase)
- [ ] T034 [US1] Add error handling for offline/API unavailable scenarios in popup.ts

**Checkpoint**: MVP complete - User can click icon and create a task. US1 fully functional and testable independently.

---

## Phase 5: User Story 3 - Task List Selection (Priority: P3)

**Goal**: User can choose which task list to save tasks to

**Independent Test**: Select non-default list in settings, create task, verify appears in selected list.

### Tests for User Story 3

- [ ] T035 [P] [US3] Write unit test for task lists API in tests/unit/task-lists.test.ts (getTaskLists, cache validation, 404 handling)
- [ ] T036 [P] [US3] Write unit test for list selection UI in tests/unit/list-selection.test.ts (render lists, handle selection, persist preference)
- [ ] T037 [US3] Verify T035, T036 tests FAIL (red phase) before proceeding

### Implementation for User Story 3

- [ ] T038 [US3] Add getTaskLists function to src/services/tasks-api.ts (with caching per data-model.md)
- [ ] T039 [US3] Verify T035 tests PASS (green phase)
- [ ] T040 [US3] Create options page HTML in src/options/options.html (task list dropdown, save button)
- [ ] T041 [US3] Create options page styles in src/options/options.css
- [ ] T042 [US3] Implement options page logic in src/options/options.ts (load lists, handle selection, save to storage)
- [ ] T043 [US3] Verify T036 tests PASS (green phase)
- [ ] T044 [US3] Update popup.ts to read selected list from preferences before creating task
- [ ] T045 [US3] Update manifest.json to include options_page entry
- [ ] T046 [US3] Add handling for deleted list scenario (show error, prompt re-selection)

**Checkpoint**: All user stories complete - user can select target list for tasks

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T047 [P] Add extension icon visual feedback (badge for success/error) in service-worker.ts
- [ ] T048 [P] Implement exponential backoff for API rate limits in tasks-api.ts
- [ ] T049 [P] Add user-friendly error messages for all error scenarios
- [ ] T050 Run full test suite and verify all tests pass
- [ ] T051 Build production bundle with `npm run build`
- [ ] T052 Verify bundle size <500KB per constitution
- [ ] T053 Manual testing: Load extension in Chrome, complete full user flow
- [ ] T054 Update README.md with setup instructions and permission documentation

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup
    ↓
Phase 2: Foundational (storage service)
    ↓
Phase 3: US2 Authentication (requires storage)
    ↓
Phase 4: US1 Task Creation (requires auth + storage) ← MVP COMPLETE
    ↓
Phase 5: US3 List Selection (requires auth + storage + tasks-api)
    ↓
Phase 6: Polish
```

### User Story Dependencies

- **User Story 2 (P2)**: Depends on Phase 2 only - implemented FIRST because auth is required by US1
- **User Story 1 (P1)**: Depends on US2 completion - cannot create tasks without auth
- **User Story 3 (P3)**: Depends on US1 completion - extends task creation with list selection

### Within Each User Story (TDD Cycle)

1. Write ALL tests for the story FIRST
2. Verify ALL tests FAIL (red phase) ← CRITICAL: Do not skip!
3. Implement minimum code to pass tests
4. Verify tests PASS (green phase)
5. Refactor if needed while keeping tests green
6. Story complete, proceed to next

### Parallel Opportunities

**Phase 1** (all parallel):
```
T003, T004, T005, T006, T008, T009 can run simultaneously
```

**Phase 3 - US2 Tests** (parallel):
```
T014, T015 can run simultaneously
```

**Phase 4 - US1 Tests** (parallel):
```
T021, T022, T023 can run simultaneously
```

**Phase 5 - US3 Tests** (parallel):
```
T035, T036 can run simultaneously
```

**Phase 6** (parallel):
```
T047, T048, T049 can run simultaneously
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US2 (Authentication)
4. Complete Phase 4: US1 (Task Creation)
5. **STOP and VALIDATE**: Test full flow end-to-end
6. Deploy/demo if ready - Extension is functional!

### Incremental Delivery

1. Setup + Foundational → Infrastructure ready
2. Add US2 (Auth) → Can sign in with Google
3. Add US1 (Task Creation) → **MVP Complete!** ← Deploy milestone
4. Add US3 (List Selection) → Enhanced organization
5. Polish → Production-ready

### TDD Reminder (Constitution Compliance)

For EVERY user story phase:
```
1. Write tests FIRST
2. Run tests - they MUST fail
3. Implement code
4. Run tests - they MUST pass
5. Refactor (optional)
6. Commit
```

**NEVER** skip step 2 (verify tests fail). This ensures tests are actually testing the right thing.

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD red-green cycle)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- US2 (P2) implemented before US1 (P1) due to dependency: auth required for task creation
