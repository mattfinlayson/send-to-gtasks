# Implementation Plan: Send Page to Google Tasks

**Branch**: `001-send-page-to-gtask` | **Date**: 2025-11-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-send-page-to-gtask/spec.md`

## Summary

Build a Chrome Extension that captures the current page's URL and title with a single click, then creates a task in the user's Google Tasks. The extension uses Google OAuth2 for authentication and allows users to select their preferred task list.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Chrome Extension APIs (Manifest V3), Google Tasks API
**Storage**: chrome.storage.local for OAuth tokens and user preferences
**Testing**: Vitest (fast, TypeScript-native, Chrome extension compatible)
**Target Platform**: Chromium-based browsers (Chrome, Edge, Brave) with Manifest V3 support
**Project Type**: Chrome Extension (single project)
**Performance Goals**: <100ms UI response, <3s task creation (per SC-001)
**Constraints**: <500KB bundle size (per constitution), <50MB memory (per SC-006)
**Scale/Scope**: Single-user extension, personal productivity tool

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Test-First Development (NON-NEGOTIABLE)

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Tests written before implementation | PLANNED | Vitest test suite created first for each component |
| Tests fail initially (red phase) | PLANNED | TDD workflow enforced in tasks.md |
| Red-green-refactor cycle | PLANNED | Task ordering ensures test → implement → refactor |

### II. Security & Privacy First

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Minimum permissions | PLANNED | Only `activeTab`, `storage`, `identity` permissions |
| Document data access | PLANNED | README documents: page URL/title (temporary), OAuth tokens (stored), selected list preference (stored) |
| HTTPS for external calls | COMPLIANT | Google Tasks API is HTTPS-only |
| No unnecessary data collection | COMPLIANT | Only captures URL/title when user clicks; no tracking |
| No hardcoded secrets | PLANNED | OAuth client ID in manifest (public), tokens via chrome.identity |
| Sanitize inputs | PLANNED | Page title sanitized before display and API submission |

### III. Simplicity & Direct Solutions

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Simplest solution (YAGNI) | PLANNED | Minimal popup UI, direct API calls, no abstraction layers |
| No premature abstractions | PLANNED | Single service module, no repository pattern |
| Delete unused code | PLANNED | No backwards compatibility needed (new project) |

### IV. Extension Performance Standards

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Bundle size <500KB | PLANNED | No heavy dependencies, tree-shaking enabled |
| Lazy-load non-critical | PLANNED | Settings UI loaded only when needed |
| Efficient background processing | PLANNED | Service worker for API calls, no persistent background |
| Batch API calls | PLANNED | Single API call per task creation |
| Cache appropriately | PLANNED | Task lists cached with 5-minute TTL |
| <100ms UI interactions | PLANNED | Immediate feedback, async API calls |

**GATE STATUS**: ✅ PASS - All constitution requirements addressed

## Project Structure

### Documentation (this feature)

```text
specs/001-send-page-to-gtask/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (Google Tasks API contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── background/
│   └── service-worker.ts    # Background service worker (Manifest V3)
├── popup/
│   ├── popup.html           # Extension popup UI
│   ├── popup.ts             # Popup logic
│   └── popup.css            # Popup styles
├── services/
│   ├── auth.ts              # Google OAuth2 authentication
│   ├── tasks-api.ts         # Google Tasks API integration
│   └── storage.ts           # chrome.storage wrapper
├── types/
│   └── index.ts             # TypeScript type definitions
└── manifest.json            # Extension manifest (V3)

tests/
├── unit/
│   ├── auth.test.ts
│   ├── tasks-api.test.ts
│   └── storage.test.ts
├── integration/
│   └── task-creation.test.ts
└── setup.ts                 # Test configuration
```

**Structure Decision**: Chrome Extension structure with separated concerns (background/popup/services) per constitution architecture guidelines. Single project with flat service layer (no unnecessary abstractions per Principle III).

## Complexity Tracking

> No violations - design adheres to simplicity principles

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

---

## Phase Completion Status

| Phase | Status | Artifacts |
|-------|--------|-----------|
| Phase 0: Research | ✅ Complete | [research.md](./research.md) |
| Phase 1: Design | ✅ Complete | [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md) |
| Phase 2: Tasks | ⏳ Pending | Run `/speckit.tasks` to generate |

**Post-Design Constitution Re-check**: ✅ PASS

All design decisions validated against constitution principles:
- TDD workflow defined in research (Vitest + vitest-chrome)
- Minimal permissions documented (activeTab, storage, identity)
- Direct API calls, no abstraction layers
- Estimated bundle <50KB (well under 500KB limit)
