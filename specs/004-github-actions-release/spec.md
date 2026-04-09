# Feature Specification: GitHub Actions CI/CD for Chrome Web Store Release

**Feature Branch**: `004-github-actions-release`  
**Created**: 2026-04-09  
**Status**: Draft  
**Input**: User description: "add github actions to support release for the web store"

## User Scenarios & Testing

### User Story 1 - Automated Quality Gates on Pull Requests (Priority: P1)

A developer submits a pull request. GitHub Actions automatically runs linting, type checking, and tests without any manual intervention.

**Why this priority**: Ensures code quality is maintained before any code merges. Prevents broken builds from reaching main branch.

**Independent Test**: Can be validated by opening a PR with intentionally broken code and verifying the workflow fails.

**Acceptance Scenarios**:

1. **Given** a pull request is opened, **When** linting or type-checking fails, **Then** the PR check fails with clear error messages
2. **Given** a pull request is opened, **When** any test fails, **Then** the PR check fails showing which tests failed
3. **Given** a pull request is opened, **When** all checks pass, **Then** the PR shows a green checkmark

---

### User Story 2 - Automated Production Build on Release (Priority: P1)

A maintainer creates a GitHub release. GitHub Actions automatically builds the extension and uploads the distributable ZIP file as a release artifact.

**Why this priority**: Eliminates manual build steps for releases, reducing human error and saving time.

**Independent Test**: Can be validated by creating a release and verifying the ZIP artifact appears in the release assets.

**Acceptance Scenarios**:

1. **Given** a release is published on GitHub, **When** the workflow triggers, **Then** a production build is created
2. **Given** a release is published on GitHub, **When** the build succeeds, **Then** the ZIP file is attached to the release
3. **Given** a release is published on GitHub, **When** the build fails, **Then** the release is not created and maintainers are notified

---

### User Story 3 - Version Consistency Enforcement (Priority: P2)

The manifest version and GitHub release tag must always match, preventing confusion about which build corresponds to which release.

**Why this priority**: Prevents releasing version 1.0.0 when the manifest says 1.0.1, which could cause users to install the wrong version.

**Independent Test**: Can be validated by attempting a release with mismatched versions and verifying the workflow fails.

**Acceptance Scenarios**:

1. **Given** a release is tagged `v1.0.0`, **When** the workflow runs, **Then** the manifest version must be `1.0.0`
2. **Given** a release is tagged `v1.0.0`, **When** the manifest version is `1.0.1`, **Then** the workflow fails with a clear error

---

### Edge Cases

- What happens when the build fails due to npm dependency issues?
- How does the system handle rate limiting from Google Cloud APIs during OAuth token generation?
- What happens if the ZIP file exceeds the GitHub release asset size limit (unlimited for releases)?
- How are credentials (Google OAuth client ID/secret) handled securely?

## Requirements

### Functional Requirements

- **FR-001**: Pull requests MUST run lint, type-check, and tests automatically
- **FR-002**: All tests MUST pass before merging is allowed (via required status checks)
- **FR-003**: Releases MUST trigger a production build automatically
- **FR-004**: Production build artifacts MUST be uploaded to GitHub Releases as downloadable ZIP files
- **FR-005**: Version numbers in release tags and manifest MUST be validated to match
- **FR-006**: Secrets (Google OAuth credentials) MUST be stored in GitHub Actions secrets, never in code
- **FR-007**: Workflow runs MUST be visible in the GitHub Actions tab with clear pass/fail status
- **FR-008**: Build logs MUST be retained for debugging failed builds

### Key Entities

- **GitHub Actions Workflow**: YAML file defining CI/CD pipeline, triggers, jobs, and steps
- **GitHub Release**: Tagged version of the code with associated artifacts
- **Production Build**: Minified, zipped extension package ready for Chrome Web Store upload
- **Secrets**: Encrypted environment variables for OAuth credentials and API keys

## Success Criteria

### Measurable Outcomes

- **SC-001**: Every pull request shows CI status within 5 minutes of opening
- **SC-002**: All failing checks provide actionable error messages within the GitHub UI
- **SC-003**: Release artifacts are available for download within 10 minutes of creating a release
- **SC-004**: Zero manual steps required to create a production-ready release artifact
- **SC-005**: Version mismatches between manifest and release tag are caught and reported before release completion
