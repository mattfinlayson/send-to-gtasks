# Implementation Plan: Enhance Task Saving

**Branch**: `006-enhance-task-saving` | **Date**: 2026-04-09 | **Spec**: [spec.md](./spec.md)

## Summary

Add 6 enhancements to the Chrome Extension task-saving workflow: notes field, due date picker, improved notifications, offline queue with retry, duplicate URL detection, and system-following dark mode.

## Technical Context

**Language/Version**: TypeScript 5.9+ (strict mode)  
**Primary Dependencies**: Chrome Extension APIs, Google Tasks REST API, Vitest 1.x  
**Storage**: `chrome.storage.local` for persistence, `chrome.storage.session` for ephemeral state  
**Testing**: Vitest with JSDOM environment  
**Target Platform**: Chrome Browser (Manifest V3)  
**Performance Goals**: <100ms UI interactions, <500KB bundle size  
**Constraints**: MV3 service worker lifecycle, offline-capable  
**Scale/Scope**: Single extension, ~10k expected users  

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Test-First Development | ✅ | All new features require tests first |
| Security & Privacy | ✅ | No new permissions, data minimized |
| Simplicity | ✅ | Minimal abstractions, reuse existing patterns |
| Performance | ✅ | Dark mode CSS-only, queue is async |

## Project Structure

```
src/
├── popup/
│   ├── popup.html      # Add notes textarea, due date picker
│   ├── popup.ts        # Handle new form fields
│   ├── popup.css       # Add dark mode styles
│   ├── toast.html      # Existing toast UI
│   └── toast.ts        # Extend for new notification types
├── background/
│   ├── service-worker.ts  # Add alarm listener for queue sync
│   └── shortcut-handler.ts  # Existing
├── services/
│   ├── storage.ts         # Add queue operations
│   ├── task-creation.ts   # Add notes/due date to API calls
│   ├── offline-queue.ts   # NEW: Queue management
│   └── duplicate-check.ts # NEW: URL detection
├── options/
│   ├── options.html    # Add dark mode toggle
│   ├── options.ts      # Persist preference
│   └── options.css     # Add dark mode styles
└── types/
    ├── index.ts        # Add QueuedTask type
    └── shortcut.ts     # Existing

tests/
├── unit/
│   ├── offline-queue.test.ts   # NEW
│   ├── duplicate-check.test.ts # NEW
│   └── storage.test.ts         # Extend
└── integration/
    └── task-creation.test.ts   # Extend
```

## Complexity Tracking

No constitution violations requiring justification.

---

## Phase 0: Research (Complete)

Research artifacts:
- `research.md` - Chrome offline patterns, Google Tasks API, notifications, dark mode
- All NEEDS CLARIFICATION resolved in spec

## Phase 1: Design (Complete)

Design artifacts:
- `data-model.md` - QueuedTask, OfflineQueue, SavedUrlIndex entities
- `contracts/enhance-task-saving.md` - UI, notification, queue, storage contracts
- `quickstart.md` - Implementation guide

## Next Steps

Run `/speckit.tasks` to generate the task breakdown.
