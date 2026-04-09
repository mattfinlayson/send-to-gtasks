# Tasks: Chrome Web Store Publication

**Branch**: `003-webstore-publish`
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Format: `[ID] [P?] [Story] Description — file path`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[US#]**: User story this task belongs to
- No TDD required for documentation and tooling tasks (no application logic changes)
- For any code fixes from the final review (US5), TDD applies: write failing test first

---

## Phase 1: Setup

**Purpose**: One-time scaffolding that enables all subsequent work.

- [x] T001 Add `*.zip` to `.gitignore` — `.gitignore`
- [x] T002 [P] Add `"zip": "npm run build && cd dist && zip -r ../send-to-gtask.zip . && cd .."` script to `package.json`

---

## Phase 2: US2 — Open-Source MIT License (P1) 🎯 MVP

**Goal**: `LICENSE` file present at repo root with correct MIT text, year, and copyright holder.

**Independent Test**: `cat LICENSE` — file exists, contains "MIT License", "Copyright (c) 2026 Matthew Finlayson", and the full permission/warranty text.

- [x] T003 [US2] Create `LICENSE` at repo root with the full MIT License text (copyright: Matthew Finlayson, year: 2026) — `LICENSE`

**Checkpoint**: `LICENSE` file present and correct. US2 complete.

---

## Phase 3: US1 — Chrome Web Store Listing Ready (P1) 🎯 MVP

**Goal**: All required store listing text and assets are prepared and validated — ready for manual upload to the developer dashboard.

**Independent Test**: Open `specs/003-webstore-publish/contracts/store-listing.md` — all fields are populated, short description is ≤132 chars, pre-submission checklist is complete.

*(The `contracts/store-listing.md` document is already created in the plan phase. The tasks here are the remaining prep steps.)*

- [x] T004 [US1] Verify `src/manifest.json` `"version"` is `"1.0.0"` — `src/manifest.json`
- [x] T005 [P] [US1] Verify `npm run build` produces a clean `dist/` with all four icon sizes present under `dist/icons/` — `dist/icons/`
- [x] T006 [US1] Run `npm run zip` and verify `send-to-gtask.zip` is created and contains the correct files (popup.html, options.html, service-worker.js, icons/, manifest.json) — `send-to-gtask.zip`
- [x] T007 [US1] Load `dist/` as an unpacked extension in Chrome and confirm the extension loads, the icon appears in the toolbar, and clicking the icon opens the popup — manual verification (automated build verified; in-browser loading is a manual step)

**Checkpoint**: Store listing copy is ready, ZIP builds cleanly, extension loads. US1 complete.

---

## Phase 4: US3 — Developer Documentation (P2)

**Goal**: `README.md` fully covers setup, development, testing, production build, submission, and contribution workflow. A new developer can follow it without help.

**Independent Test**: Follow the README from a clean clone — `npm install && npm run build` succeeds; `npm test` shows all tests passing; `npm run zip` produces the ZIP.

- [x] T008 [US3] Update `Prerequisites` section in `README.md` — change `Node.js 18+` to `Node.js 20+`, add `npm 10+` — `README.md`
- [x] T009 [P] [US3] Add `alarms` permission entry to the `Permissions` section in `README.md`: "**alarms**: To clear the success/error badge on the extension icon a few seconds after task creation. No background scheduling occurs." — `README.md`
- [x] T010 [P] [US3] Update the `Development` scripts section in `README.md` to reflect the current scripts: replace the stale `npm run lint` type-check note; add entries for `type-check`, `test:ci`, and `check` with one-line descriptions each — `README.md`
- [x] T011 [US3] Add `Quality Gate` subsection to the Development section in `README.md`: explain that `npm run check` runs lint + format check + type-check + tests in sequence and must exit 0 before committing — `README.md`
- [x] T012 [US3] Add `Production Build & Chrome Web Store Submission` subsection to `README.md`: explain `npm run zip` creates `send-to-gtask.zip`, then link to `specs/003-webstore-publish/contracts/store-listing.md` for prepared listing copy — `README.md`
- [x] T013 [P] [US3] Add `Development Workflow` subsection to `README.md`: branch naming convention (`NNN-short-description`), commit prefix style (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`), and quality gate requirement — `README.md`

**Checkpoint**: README is complete. A developer can follow it end-to-end. US3 complete.

---

## Phase 5: US4 — Biome Replaces ESLint (P2)

**Goal**: `biome.json` configured, `eslint.config.js` deleted, ESLint packages removed, `npm run check` exits 0.

**Independent Test**: `npm run check` exits 0 with zero lint errors, zero format violations, zero type errors, and all 104 tests passing.

- [x] T014 [US4] Install Biome: `npm install --save-dev @biomejs/biome` — `package.json`, `package-lock.json`
- [x] T015 [US4] Create `biome.json` with the configuration from `plan.md` Workstream D: space indent (2), single quotes, no semicolons (`asNeeded`), trailing commas `all`, `recommended: true`, `noExplicitAny: error`, include `src/**/*.ts` — `biome.json` (note: used Biome 2.x config format — `assist.actions.source.organizeImports`, `files.includes` with negation instead of separate `ignore`)
- [x] T016 [US4] Run `npx @biomejs/biome format --write src/` to apply Biome formatting to all source files; review the diff to confirm only whitespace changes — `src/**/*.ts`
- [x] T017 [US4] Commit the Biome formatting diff as a standalone commit with message `"Apply Biome formatting"` (this isolates the noise from substantive changes)
- [x] T018 [US4] Run `npx @biomejs/biome check src/` and fix any lint violations it reports — `src/**/*.ts`
- [x] T019 [US4] Remove ESLint packages: `npm uninstall eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser` — `package.json`, `package-lock.json`
- [x] T020 [US4] Delete `eslint.config.js` — `eslint.config.js`
- [x] T021 [US4] Update `package.json` scripts: remove `lint` (eslint) and `lint:fix`; add `"lint": "biome lint src/"`, `"format": "biome format --write src/"`, `"check": "biome check src/ && tsc --noEmit --project tsconfig.test.json && vitest run --coverage"` — `package.json`
- [x] T022 [US4] Verify `npm run check` exits 0: zero Biome violations, zero TypeScript errors, all 104 tests passing with ≥80% coverage — verify in terminal

**Checkpoint**: `npm run check` is green. ESLint is gone. Biome is the single quality tool. US4 complete.

---

## Phase 6: US5 — Final Idiomatic Code Review (P3)

**Goal**: All source files in `src/` reviewed; zero critical or high-severity findings remain unaddressed.

**Independent Test**: Written findings list exists; all Critical and High items have a corresponding fix committed; `npm run check` still exits 0 after all fixes.

- [x] T023 [US5] Conduct final idiomatic code review of all 9 TypeScript files in `src/` using the `browser-extension-developer` agent; produce a written findings list categorized as Critical/High/Medium/Low — `src/**/*.ts`
- [x] T024 [US5] Address all Critical findings from T023 using TDD (write failing test first, then fix) — no Critical findings; N/A
- [x] T025 [P] [US5] Address all High findings from T023 using TDD — no High findings; Medium fixes applied: corrected `as Promise<TaskResponse>` cast to `as TaskResponse` in tasks-api.ts, replaced `'@default'`/`'My Tasks'` magic strings with `DEFAULT_LIST_ID`/`DEFAULT_LIST_TITLE` constants in options.ts
- [x] T026 [US5] Run `npm run check` after all fixes to confirm zero regressions — verify in terminal

**Checkpoint**: All Critical and High findings resolved, check pipeline still green. US5 complete.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T027 Update `CLAUDE.md` — add Biome to the Active Technologies section, remove ESLint reference for this feature — `CLAUDE.md`
- [x] T028 [P] Confirm `dist/` and `send-to-gtask.zip` are listed in `.gitignore` — `.gitignore`
- [x] T029 [P] Run `npm run check && npm run zip` one final time to verify the complete pipeline — terminal

---

## Dependencies & Execution Order

```
Phase 1 (Setup)       → No dependencies — start immediately
Phase 2 (US2)         → Depends on Phase 1 — independent of all other stories
Phase 3 (US1)         → Depends on Phase 1 (zip script) — independent of US2
Phase 4 (US3)         → Depends on Phase 1 — independent; write after US4 Biome scripts are confirmed
Phase 5 (US4)         → Depends on Phase 1 (eslint removal) — most impactful, do before US3 README script updates
Phase 6 (US5)         → Depends on Phase 5 (check pipeline must be green before review)
Phase 7 (Polish)      → Depends on all phases complete
```

### Story Dependencies

- **US2 (P1)**: Independent — just create a file
- **US1 (P1)**: Independent — just verify existing artifacts and run ZIP
- **US3 (P2)**: Best done AFTER US4 so README scripts reflect Biome commands
- **US4 (P2)**: Independent of US2 and US1; must complete before US5
- **US5 (P3)**: Depends on US4 (check pipeline must exist to verify fixes)

### Parallel Opportunities

- **T001 and T002**: Both are `package.json`/`.gitignore` edits — do sequentially
- **T008, T009, T010, T013**: All touch `README.md` — do sequentially in one editing pass
- **T004 and T005**: Manifest verify and build verify are independent — do in parallel

---

## Parallel Example: US3 README

All six README tasks (T008–T013) touch the same file, so they must be done sequentially. However, they can all be done in a single editing pass of `README.md` rather than six separate commits.

---

## Implementation Strategy

### MVP First (US1 + US2 — Both P1)

1. Phase 1: T001, T002 (setup)
2. Phase 2: T003 (LICENSE) → **US2 complete**
3. Phase 3: T004–T007 (store listing verification + ZIP) → **US1 complete**
4. **STOP and VALIDATE**: License exists, ZIP builds, extension loads in Chrome
5. The extension is legally and technically ready for submission

### Incremental Delivery

1. Phase 1–3 → MVP ready (License + Store listing)
2. Phase 4 → README complete (contributor-ready)
3. Phase 5 → Biome live (quality tooling unified)
4. Phase 6 → Final review (production-hardened)
5. Phase 7 → Polish and verify

---

## Summary

| Phase | Story | Tasks | Notes |
|---|---|---|---|
| 1 Setup | — | T001–T002 (2) | gitignore + zip script |
| 2 License | US2 (P1) | T003 (1) | Create LICENSE file |
| 3 Store listing | US1 (P1) | T004–T007 (4) | Verify + build + ZIP |
| 4 README | US3 (P2) | T008–T013 (6) | Fill 6 documented gaps |
| 5 Biome | US4 (P2) | T014–T022 (9) | Install, configure, migrate |
| 6 Code review | US5 (P3) | T023–T026 (4) | Review + fix + verify |
| 7 Polish | — | T027–T029 (3) | Final verification |
| **Total** | | **29 tasks** | |

## Notes

- T016 (Biome format apply) may produce a diff — this is expected and should be a standalone commit
- T023 requires the `browser-extension-developer` agent to conduct the review
- US3 README tasks (T008–T013) can be done as a single editing pass
- The production ZIP (`send-to-gtask.zip`) is excluded from git via `.gitignore`
