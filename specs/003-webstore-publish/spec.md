# Feature Specification: Chrome Web Store Publication

**Feature Branch**: `003-webstore-publish`
**Created**: 2026-04-08
**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Extension Is Discoverable on the Chrome Web Store (Priority: P1)

A prospective user searches for "Google Tasks" or "save to tasks" on the Chrome Web Store and finds the extension. The listing has a clear name, a compelling short description, a detailed long description, and polished store assets. They install with one click.

**Why this priority**: Without a published listing the extension has zero users. This is the minimum viable outcome for the entire feature.

**Independent Test**: Verify the Chrome Web Store developer dashboard shows a published listing with name, short description, long description, and icon that passes pre-submission validation.

**Acceptance Scenarios**:

1. **Given** a published listing, **When** a user searches "save page Google Tasks" on the Web Store, **Then** the extension appears with a readable name and short description.
2. **Given** the listing page, **When** a prospective user views it, **Then** they see a clear explanation of what the extension does, who it is for, and what permissions it requires.
3. **Given** the store assets, **When** Chrome Web Store automated review runs, **Then** all required metadata fields are present and no policy violations are flagged.

---

### User Story 2 - Project Has an Open-Source License (Priority: P1)

A developer or user viewing the source code repository can see that the project is released under the MIT License. The license file is present at the project root and the license type is declared in the project metadata.

**Why this priority**: An extension without an explicit license is legally ambiguous. MIT must be declared before the extension is public.

**Independent Test**: Open the repository root — a `LICENSE` file exists with full MIT License text, correct year, and correct copyright holder.

**Acceptance Scenarios**:

1. **Given** the repository root, **When** a user opens it, **Then** a `LICENSE` file is present containing the full MIT License text.
2. **Given** the project metadata, **When** a user checks the declared license, **Then** it reads "MIT" consistently across all relevant project files.

---

### User Story 3 - New Contributors Can Onboard Without Help (Priority: P2)

A developer who has never seen the codebase opens the README and can clone, install, build, test, and run the extension locally without asking anyone for help. The README also explains how to create a production build and submit to the store.

**Why this priority**: Good developer documentation enables community contributions and reduces bus-factor risk. It does not block store submission but is expected for any public open-source project.

**Independent Test**: A developer with no prior exposure follows the README steps and successfully loads the extension in Chrome and runs the full test suite within 15 minutes.

**Acceptance Scenarios**:

1. **Given** only the README, **When** a developer follows the setup steps, **Then** they can build the extension and load it from `dist/` in Chrome without errors.
2. **Given** the README testing section, **When** a developer follows it, **Then** they can run the full test suite and see all tests passing.
3. **Given** the README deployment section, **When** a developer follows it, **Then** they understand how to create a production ZIP and submit it to the Chrome Web Store developer dashboard.
4. **Given** the README, **When** a contributor reads the development workflow section, **Then** they understand the branching strategy, commit conventions, and quality gates.

---

### User Story 4 - Code Quality Tooling Is Unified and Enforced (Priority: P2)

The project uses a single tool for linting, formatting, and import organization. Running the quality check command produces zero violations on the current codebase and is enforced in the npm script pipeline.

**Why this priority**: Unifying onto a single quality tool reduces configuration complexity before the codebase is public and prevents regressions.

**Independent Test**: Run the lint/format check command on the full codebase — exits 0 with zero violations. Running the formatter produces no diff on committed code.

**Acceptance Scenarios**:

1. **Given** the current source code, **When** the lint command runs, **Then** it exits 0 and reports zero errors or warnings.
2. **Given** a file with formatting inconsistencies, **When** the format command runs, **Then** it corrects them and the check command subsequently exits 0.
3. **Given** the test pipeline, **When** it runs, **Then** it includes type-checking and lint as gates, failing fast if either is violated.
4. **Given** a newly added source file with style violations, **When** a developer runs the check pipeline, **Then** they receive actionable feedback on any lint, format, or type errors.

---

### User Story 5 - Final Code Review Surfaces No Remaining Issues (Priority: P3)

The codebase undergoes a final idiomatic review pass before public release, catching any remaining non-idiomatic patterns, dead code, inconsistent naming, or missing edge-case handling.

**Why this priority**: A final review is a one-time quality gate before the extension is visible to the public. It does not block store submission itself but is required before marking the release complete.

**Independent Test**: A reviewer audits all source files in `src/` and produces a written findings list. Zero critical or high-severity findings remain unaddressed.

**Acceptance Scenarios**:

1. **Given** all source files in `src/`, **When** a reviewer audits them for idiomatic patterns, **Then** zero critical or high-severity findings remain.
2. **Given** the review findings, **When** each is addressed, **Then** all tests continue to pass with no regressions.

---

### Edge Cases

- What if the extension name is already taken on the Chrome Web Store? The listing name may need a minor variation — decide before submission.
- What if Biome's formatter produces a diff on existing code? All formatting changes must be committed before the formatter check is added to the pipeline gate.
- What if the final code review finds issues requiring significant refactoring? Only critical and high-severity findings must be resolved before submission; medium and low items are tracked as follow-up work.
- What if a contributor's machine uses a different Node.js version? The README must specify the minimum required Node version.

## Requirements *(mandatory)*

### Functional Requirements

**Store Listing**

- **FR-001**: A Chrome Web Store listing MUST be prepared with a name, short description (≤132 characters), and detailed long description.
- **FR-002**: The listing MUST use the extension icon already present at 16, 32, 48, and 128px.
- **FR-003**: The listing's detailed description MUST explain what the extension does, list key features, state what permissions are required and why, and link to the source repository.
- **FR-004**: The manifest `version` field MUST be set to `1.0.0` for the initial release.

**License**

- **FR-005**: A `LICENSE` file MUST exist at the repository root containing the full MIT License text with the correct year and copyright holder.
- **FR-006**: The `package.json` `license` field MUST be set to `"MIT"`.

**Developer Documentation**

- **FR-007**: A `README.md` MUST exist at the repository root with sections covering: project overview, prerequisites, installation, development workflow, testing, production build, and Chrome Web Store submission.
- **FR-008**: The README MUST explain each required permission (`activeTab`, `storage`, `identity`, `alarms`) in plain language.
- **FR-009**: The README MUST document how to run the full quality gate pipeline and what each step validates.

**Code Quality Tooling**

- **FR-010**: The project MUST use Biome as the single tool for linting and formatting all TypeScript source files in `src/`.
- **FR-011**: Biome MUST be configured to enforce the existing code style (2-space indent, double quotes, trailing commas as currently used).
- **FR-012**: ESLint and all ESLint-related dependencies MUST be removed once Biome is confirmed working.
- **FR-013**: A `check` script MUST exist in `package.json` that runs Biome lint + format check, type-checking, and the test suite in sequence.
- **FR-014**: The `check` script MUST exit non-zero if any lint error, format violation, type error, or test failure is detected.

**Final Code Review**

- **FR-015**: All source files in `src/` MUST be reviewed for idiomatic TypeScript patterns, dead code, and missing edge-case handling.
- **FR-016**: All critical and high-severity findings from the review MUST be resolved before submission.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The Chrome Web Store listing preparation is complete — name, short description, long description, and icon are ready for upload with no missing required fields.
- **SC-002**: A `LICENSE` file exists at the repository root containing the full MIT License text.
- **SC-003**: A new developer can follow the README and have a working local build within 15 minutes.
- **SC-004**: Running `npm run check` exits 0 with zero lint errors, zero format violations, zero type errors, and all tests passing.
- **SC-005**: The production build produces a distributable ZIP that passes Chrome Web Store pre-submission validation.
- **SC-006**: Zero critical or high-severity issues remain open from the final code review.

## Assumptions

- The copyright holder for the MIT License is Matthew Finlayson.
- The initial store listing will not include promotional screenshot images — the icon is sufficient for initial submission. Screenshots can be added in a follow-up.
- Biome replaces ESLint entirely; no hybrid ESLint + Biome configuration is needed.
- Biome will be configured to match the existing code style to minimize formatting diff noise.
- The Chrome Web Store submission itself (uploading the ZIP, completing store forms, submitting for review) is a manual step performed by the developer; this feature prepares all required inputs.
- The `README.md` targets developers and contributors, not end users — end-user guidance lives on the store listing page.
- Type-checking uses `tsconfig.test.json` (covers both `src/` and `tests/`) as established in feature 002.
