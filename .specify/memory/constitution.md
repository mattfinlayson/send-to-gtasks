<!--
SYNC IMPACT REPORT
==================
Version Change: [Not versioned] → 1.0.0
Change Type: Initial constitution establishment
Modified Principles: N/A (initial creation)
Added Sections:
  - Core Principles (4 principles established)
  - Chrome Extension Standards
  - Development Workflow
  - Governance
Templates Status:
  ✅ plan-template.md - reviewed, constitution check section compatible
  ✅ spec-template.md - reviewed, user story and requirements format compatible
  ✅ tasks-template.md - reviewed, TDD workflow and structure compatible
  ✅ command files - reviewed, no agent-specific references found
Follow-up TODOs: None
Rationale: Version 1.0.0 because this is the first formal constitution establishing governance and core principles.
-->

# send-to-gtask Constitution

## Core Principles

### I. Test-First Development (NON-NEGOTIABLE)

Test-Driven Development is mandatory for all code:

- Tests MUST be written first and approved by stakeholders before implementation begins
- Tests MUST fail initially (red phase)
- Implementation proceeds only after tests are confirmed failing (green phase)
- Code is refactored only after tests pass (refactor phase)
- The strict red-green-refactor cycle cannot be bypassed

**Rationale**: TDD ensures requirements are clear, code is testable by design, and regressions are caught immediately. For a Chrome Extension handling user data and API integrations, this discipline prevents security vulnerabilities and integration bugs.

### II. Security & Privacy First

User trust is paramount in browser extensions:

- MUST request only the minimum permissions required for functionality
- MUST explicitly document what data is accessed, stored, and transmitted
- MUST use secure communication (HTTPS) for all external API calls
- MUST NOT collect, store, or transmit user data beyond what is necessary for core functionality
- MUST implement proper secret management (API keys never hardcoded)
- MUST sanitize all user inputs to prevent XSS and injection attacks

**Rationale**: Chrome Extensions have elevated privileges in the browser. Security vulnerabilities or privacy violations can expose sensitive user data, damage trust, and result in extension removal from the Chrome Web Store.

### III. Simplicity & Direct Solutions

Avoid over-engineering and premature abstractions:

- Start with the simplest solution that solves the immediate requirement (YAGNI)
- Do not add features, refactoring, or "improvements" beyond what was explicitly requested
- Do not create abstractions, helpers, or utilities for one-time operations
- Three similar lines of code are better than a premature abstraction
- Only add error handling for scenarios that can actually occur
- Delete unused code completely—no backwards-compatibility hacks

**Rationale**: Chrome Extensions need to be lightweight, fast, and maintainable. Over-engineering increases bundle size, load times, and complexity without delivering user value.

### IV. Extension Performance Standards

Chrome Extensions must be fast and efficient:

- MUST minimize bundle size (target: <500KB total)
- MUST lazy-load non-critical functionality
- MUST use efficient background processing (avoid blocking main thread)
- MUST batch API calls where possible to reduce network overhead
- MUST cache appropriately to minimize redundant operations
- MUST measure and optimize critical user paths (target: <100ms for UI interactions)

**Rationale**: Extensions compete for browser resources. Poor performance impacts user experience across all tabs and can cause the extension to be disabled or uninstalled.

## Chrome Extension Standards

### Manifest & Permissions

- Use Manifest V3 (latest standard as of 2025)
- Declare minimum required permissions in manifest.json
- Use optional permissions for non-critical features
- Document each permission's purpose in README

### Architecture

- Separate concerns: content scripts, background service workers, popup UI
- Use message passing for communication between contexts
- Implement proper error boundaries and fallback states
- Handle extension updates and migrations gracefully

### API Integration

- Google Tasks API integration MUST use official client libraries where available
- API credentials MUST be stored securely (OAuth tokens in chrome.storage with encryption)
- MUST handle API rate limits and implement exponential backoff
- MUST provide clear error messages for API failures

## Development Workflow

### Test-First Workflow (Strict)

1. Write tests for new functionality
2. Review tests with stakeholders for approval
3. Confirm tests fail (red phase)
4. Implement minimum code to pass tests (green phase)
5. Refactor while keeping tests green
6. Commit only when all tests pass

### Code Review Requirements

- All PRs MUST verify constitution compliance
- Tests MUST be included and passing
- Security implications MUST be assessed
- Performance impact MUST be documented for UI changes
- Breaking changes MUST include migration plan

### Complexity Justification

If a feature violates simplicity principles (e.g., adding a new abstraction layer, introducing a complex pattern), the PR MUST include:

- Clear justification for why simpler alternatives are insufficient
- Documentation of the specific problem being solved
- Evidence that the complexity is warranted

## Governance

### Authority

This constitution supersedes all other development practices and guidelines for the send-to-gtask project. When conflicts arise between this constitution and other documentation, the constitution takes precedence.

### Amendment Process

Amendments to this constitution require:

1. Written proposal documenting the change and rationale
2. Review and approval from project maintainers
3. Migration plan for any affected code or practices
4. Version increment per semantic versioning rules

### Versioning Policy

- **MAJOR**: Backward incompatible governance changes, principle removals, or redefinitions
- **MINOR**: New principles added, sections expanded materially
- **PATCH**: Clarifications, wording improvements, typo fixes

### Compliance

- All pull requests MUST demonstrate compliance with core principles
- Code reviews MUST verify adherence to security, testing, and simplicity requirements
- Violations MUST be addressed before merge or explicitly justified in Complexity Tracking section

### Review Cycle

The constitution MUST be reviewed at major project milestones (initial release, major version bumps) to ensure principles remain relevant and effective.

**Version**: 1.0.0 | **Ratified**: 2025-11-25 | **Last Amended**: 2025-11-25
