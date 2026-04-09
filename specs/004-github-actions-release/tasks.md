# Tasks: GitHub Actions CI/CD for Chrome Web Store Release

**Input**: Design documents from `/specs/004-github-actions-release/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Tests**: N/A - CI/CD workflows themselves are the "tests" for code quality. No separate test tasks needed.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Project Infrastructure)

**Purpose**: Create GitHub Actions workflow directory and structure

- [x] T001 [P] Create `.github/workflows/` directory structure
- [x] T002 Add `.github/` to `.gitignore` if needed (GitHub Actions creates this automatically)

---

## Phase 2: Foundational (Workflow Definitions)

**Purpose**: Core workflow infrastructure

- [x] T003 Create `ci.yml` workflow file in `.github/workflows/ci.yml`
- [x] T004 Create `release.yml` workflow file in `.github/workflows/release.yml`

---

## Phase 3: User Story 1 - Automated Quality Gates on Pull Requests (Priority: P1) 🎯 MVP

**Goal**: PRs automatically run lint, type-check, and tests before merging

**Independent Test**: Open a PR with intentionally broken code; verify workflow fails

### Implementation for User Story 1

- [x] T005 [P] [US1] Implement CI workflow trigger for `pull_request` events targeting `main`
- [x] T006 [P] [US1] Add job to run `npm run lint` (Biome linting)
- [x] T007 [P] [US1] Add job to run `npm run type-check` (TypeScript)
- [x] T008 [US1] Add job to run `npm run test` (Vitest with coverage)
- [x] T009 [US1] Configure jobs to fail fast on any failure
- [x] T010 [US1] Add `concurrency` group to cancel in-progress runs on new push

**Checkpoint**: At this point, opening a PR should trigger CI checks

---

## Phase 4: User Story 2 - Automated Production Build on Release (Priority: P1) 🎯 MVP

**Goal**: Releases automatically build and attach ZIP artifact

**Independent Test**: Create a release and verify ZIP appears in release assets

### Implementation for User Story 2

- [x] T011 [P] [US2] Implement Release workflow trigger for `release` events with `types: [published]`
- [x] T012 [P] [US2] Add step to checkout code with `fetch-depth: 0` for tag access
- [x] T013 [P] [US2] Add step to install dependencies with npm caching
- [x] T014 [US2] Add step to run `npm run build` (production build)
- [x] T015 [US2] Add step to run `npm run zip` (create distributable)
- [x] T016 [US2] Add step to upload `send-to-gtask.zip` as release asset

**Checkpoint**: Publishing a release should produce a downloadable artifact

---

## Phase 5: User Story 3 - Version Consistency Enforcement (Priority: P2)

**Goal**: Prevent releasing when manifest version doesn't match git tag

**Independent Test**: Create release with mismatched version; verify workflow fails

### Implementation for User Story 3

- [x] T017 [P] [US3] Add version validation step in release.yml
- [x] T018 [US3] Extract version from git tag (strip `v` prefix) using bash parameter expansion
- [x] T019 [US3] Extract version from `src/manifest.json` using grep/cut
- [x] T020 [US3] Add conditional to fail workflow if versions don't match

**Checkpoint**: Mismatched versions should cause workflow failure with clear error

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements and documentation

- [x] T021 [P] Update `AGENTS.md` with GitHub Actions documentation
- [x] T022 [P] Update `README.md` with CI/CD badge and release process
- [x] T023 Validate workflows work correctly by reviewing YAML syntax
- [x] T024 Document release process in project documentation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - starts immediately
- **Foundational (Phase 2)**: Depends on Setup
- **User Stories (Phase 3-5)**: All depend on Foundational phase
  - US1 and US2 can proceed in parallel (separate workflow files)
  - US3 builds on US2's release workflow
- **Polish (Phase 6)**: Depends on all user stories

### User Story Dependencies

- **US1 (P1)**: Independent - CI workflow
- **US2 (P1)**: Independent - Release workflow
- **US3 (P2)**: Depends on US2 - Version validation in release workflow

### Within Each User Story

- Workflow trigger configuration
- Setup steps (checkout, node, dependencies)
- Main execution steps
- Artifact/upload steps

### Parallel Opportunities

- T005-T006-T007: All CI job definitions can be created in parallel
- T011-T012-T013: All Release setup steps can be created in parallel
- T017-T018-T019: All version validation steps can be created in parallel
- T021-T022: Both documentation updates can be done in parallel

---

## Parallel Example: User Story 1 (CI Workflow)

```bash
# Create CI workflow with parallel job definitions:
Task: "Implement CI workflow trigger for pull_request events"
Task: "Add npm run lint job"
Task: "Add npm run type-check job"
Task: "Add npm run test job"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2)

1. Complete Phase 1: Setup directory structure
2. Complete Phase 2: Create both workflow files
3. Complete Phase 3: Implement CI workflow (US1)
4. Complete Phase 4: Implement Release workflow (US2)
5. **STOP and VALIDATE**: Test both workflows
6. Deploy/demo (workflows are live!)

### Full Feature

1. Complete Phase 1-4 (MVP)
2. Complete Phase 5: Add version validation (US3)
3. Complete Phase 6: Polish and documentation

### Incremental Delivery

1. Phase 1-2: Infrastructure ready
2. Phase 3: CI workflow live → PRs now have automated checks
3. Phase 4: Release workflow live → Releases now produce artifacts
4. Phase 5: Version validation prevents mismatches
5. Phase 6: Documentation complete

---

## Notes

- **[P] tasks**: Different files, no dependencies - can run in parallel
- **No tests needed**: CI/CD workflows ARE the tests for code quality
- **GitHub Actions conventions**: Workflows go in `.github/workflows/`
- **Workflow syntax**: Use `actions/setup-node@v4` for Node.js setup
- **npm caching**: Use `cache: 'npm'` in setup-node action
- **Checkout depth**: Use `fetch-depth: 0` for release workflow to access tags
