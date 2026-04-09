# Tasks: Keyboard Shortcut

**Input**: Design documents from `/specs/005-keyboard-shortcut/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Include test tasks per Constitution TDD requirement

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add keyboard shortcut command to Chrome manifest

- [X] T001 Update manifest.json to add `_execute_action` command definition with `Ctrl+Shift+T` default
- [X] T002 Add command description "Save current page as task" to manifest.json
- [X] T003 Verify manifest.json is valid Chrome Extension manifest format

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that enables all user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 [P] Create ShortcutPreference type definition in `src/types/shortcut.ts`
- [X] T005 [P] Create storage service for shortcut preferences in `src/services/storage.ts`
- [X] T006 [P] Create shortcut handler module skeleton in `src/background/shortcut-handler.ts`
- [X] T007 Add command listener in `src/background/service-worker.ts` to route to shortcut handler

**Checkpoint**: Foundation ready - command registered and handler infrastructure in place

---

## Phase 3: User Story 1 - Quick Save via Keyboard (Priority: P1) 🎯 MVP

**Goal**: Press Ctrl+Shift+T to trigger task creation (popup or direct)

**Independent Test**: Press Ctrl+Shift+T on any webpage → popup opens with page title/URL pre-filled, OR (with quick save enabled) task created directly with toast

### Tests for User Story 1 (Write FIRST - TDD) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T008 [P] [US1] Unit test: shortcut-handler triggers popup open in tests/unit/shortcut-handler.test.ts
- [X] T009 [P] [US1] Unit test: quick save mode creates task without popup in tests/unit/shortcut-handler.test.ts
- [X] T010 [P] [US1] Unit test: toast appears on quick save in tests/unit/shortcut-handler.test.ts

### Implementation for User Story 1

- [X] T011 [P] [US1] Implement shortcut-handler to open popup with page title/URL in `src/background/shortcut-handler.ts`
- [X] T012 [P] [US1] Create toast popup HTML in `src/popup/toast.html`
- [X] T013 [P] [US1] Create toast popup logic in `src/popup/toast.ts`
- [X] T014 [US1] Integrate task-creator service for quick save mode (reuse existing) in `src/background/shortcut-handler.ts`
- [X] T015 [US1] Add quick_save_enabled check before showing toast in `src/background/shortcut-handler.ts`

**Checkpoint**: At this point, User Story 1 should be fully functional - press shortcut, popup opens (or toast if quick save enabled)

---

## Phase 4: User Story 2 - Customize Keyboard Shortcut (Priority: P2)

**Goal**: User can change the keyboard shortcut and enable quick save mode via options page

**Independent Test**: Open options page → change shortcut → verify new shortcut triggers action → reset to default → verify default works

### Tests for User Story 2 (Write FIRST - TDD) ⚠️

- [ ] T016 [P] [US2] Unit test: options page displays current shortcut in tests/unit/options.test.ts
- [ ] T017 [P] [US2] Unit test: options page saves custom shortcut in tests/unit/options.test.ts
- [ ] T018 [P] [US2] Unit test: options page toggles quick_save_enabled in tests/unit/options.test.ts
- [ ] T019 [P] [US2] Unit test: reset button restores default shortcut in tests/unit/options.test.ts

### Implementation for User Story 2

- [X] T020 [P] [US2] Add shortcut settings section to `src/options/options.html`
- [X] T021 [P] [US2] Add shortcut input field and quick save checkbox to options page in `src/options/options.ts`
- [X] T022 [P] [US2] Implement save shortcut validation and persistence in `src/options/options.ts`
- [X] T023 [P] [US2] Add reset to default button handler in `src/options/options.ts`
- [X] T024 [US2] Add styles for shortcut settings in `src/options/options.css`

**Checkpoint**: At this point, User Story 2 should be functional - options page allows customization

---

## Phase 5: User Story 3 - Shortcut Conflict Handling (Priority: P3)

**Goal**: System validates shortcuts and prevents/warns about conflicts

**Independent Test**: Open options → enter conflicting shortcut (e.g., Ctrl+T) → verify warning shown → try to save → should be prevented

### Tests for User Story 3 (Write FIRST - TDD) ⚠️

- [ ] T025 [P] [US3] Unit test: invalid shortcut format shows error in tests/unit/validation.test.ts
- [ ] T026 [P] [US3] Unit test: Chrome built-in shortcut conflict detected and prevented in tests/unit/validation.test.ts
- [ ] T027 [P] [US3] Unit test: conflict error message displayed to user in tests/unit/validation.test.ts

### Implementation for User Story 3

- [X] T028 [P] [US3] Create shortcut validation service in `src/services/shortcut-validator.ts`
- [X] T029 [P] [US3] Implement Chrome command conflict detection using `chrome.commands.onChanged` in `src/services/shortcut-validator.ts`
- [X] T030 [P] [US3] Create list of Chrome built-in shortcuts to avoid in `src/services/shortcut-validator.ts`
- [X] T031 [US3] Integrate validation into options page save handler in `src/options/options.ts`
- [X] T032 [US3] Add error message display for validation failures in `src/options/options.html`

**Checkpoint**: At this point, User Story 3 should be functional - conflicts are detected and prevented

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T033 [P] Run linting and fix any issues in `src/`
- [X] T034 [P] Run TypeScript type check and fix any errors
- [X] T035 Run all unit tests and ensure 100% pass rate
- [X] T036 Verify extension loads without errors in Chrome
- [X] T037 Test shortcut works on various webpages (cross-origin)
- [X] T038 Test quick save toast displays for correct duration (2s)
- [X] T039 Update README with keyboard shortcut documentation
- [X] T040 Run `npm run check` (Biome lint + TypeScript check + tests with coverage)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational - No dependencies on US1 (options page independent)
- **User Story 3 (P3)**: Can start after Foundational - No dependencies on other stories

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD per Constitution)
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel
- All tests for a user story marked [P] can run in parallel
- Type definitions can be created in parallel with storage service

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit test: shortcut-handler triggers popup open"
Task: "Unit test: quick save mode creates task without popup"
Task: "Unit test: toast appears on quick save"

# Launch all implementations for User Story 1 together:
Task: "Implement shortcut-handler in src/background/shortcut-handler.ts"
Task: "Create toast popup HTML in src/popup/toast.html"
Task: "Create toast popup logic in src/popup/toast.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (add command to manifest)
2. Complete Phase 2: Foundational (types, storage, handler skeleton)
3. Complete Phase 3: User Story 1 (shortcut → popup/toast)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Polish phase → Final release

---

## Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 40 |
| Phase 1 (Setup) | 3 |
| Phase 2 (Foundational) | 4 |
| Phase 3 (US1) | 8 |
| Phase 4 (US2) | 9 |
| Phase 5 (US3) | 8 |
| Phase 6 (Polish) | 8 |

**Parallelizable Tasks**: 23 (marked [P])

**MVP Scope**: User Story 1 (Phase 3) after completing Setup + Foundational

**Independent Test Criteria by Story**:
- US1: Press Ctrl+Shift+T → popup opens OR (with quick save) task created + toast shown
- US2: Open options → change shortcut → new shortcut works
- US3: Enter Ctrl+T → conflict warning shown → save prevented
