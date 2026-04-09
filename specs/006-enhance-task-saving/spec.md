# Feature Specification: Enhance Task Saving

**Feature Branch**: `006-enhance-task-saving`  
**Created**: 2026-04-09  
**Status**: Draft  
**Input**: User description: "Quick notes/annotation - Add a quick note before saving. Due date picker - When saving, set a due date. Success/error notification - Better toast notifications. Offline queue - If API fails, queue the task for retry. Duplicate detection - Dont save the same URL twice to same list. Dark mode - For the popup/options UI"

## User Scenarios & Testing

### User Story 1 - Add Notes to Saved Tasks (Priority: P1)

As a user, I want to add a quick note or annotation before saving a page as a task, so I can capture additional context that won't fit in a title.

**Why this priority**: Core value proposition - the ability to add notes makes the saved tasks more useful and actionable. This is a fundamental enhancement to the task-saving workflow.

**Independent Test**: Can be fully tested by saving a page with a note and verifying the note appears in the created Google Task.

**Acceptance Scenarios**:

1. **Given** I'm on a webpage with the popup open, **When** I enter text in a "Notes" field before saving, **Then** the task is created with my note attached
2. **Given** I'm using quick-save mode with keyboard shortcut, **When** I initiate a quick save, **Then** the task is created with just the page title/URL (no notes - notes only available in popup mode)

---

### User Story 2 - Due Date Selection (Priority: P2)

As a user, I want to set a due date when saving a page as a task, so I can track when the saved item needs attention.

**Why this priority**: Essential for task management - due dates are a core feature of any task system. Without them, saved pages become just a list with no urgency or timeline.

**Independent Test**: Can be fully tested by saving a page with a selected due date and verifying the due date is set in Google Tasks.

**Acceptance Scenarios**:

1. **Given** I'm saving a task via the popup, **When** I click a due date picker and select a date, **Then** the created task has the selected due date
2. **Given** the due date picker is open, **When** I don't select a date, **Then** the task is created without a due date (optional field)
3. **Given** I'm setting a due date, **When** I select a date in the past, **Then** a warning is shown but the task is still saved

---

### User Story 3 - Better Notifications (Priority: P1)

As a user, I want clear success and error notifications when saving tasks, so I know what happened and can take action if something went wrong.

**Why this priority**: Critical for user confidence - users need to know their task was actually saved. Current notifications may be unclear or missing error details.

**Independent Test**: Can be fully tested by saving a task successfully and by simulating an API error to verify error handling.

**Acceptance Scenarios**:

1. **Given** a task is saved successfully, **When** the save completes, **Then** I see a clear success notification with the task title
2. **Given** a task save fails due to network error, **When** the save attempt completes, **Then** I see an error notification explaining what went wrong
3. **Given** a task save fails, **When** the error occurs, **Then** I have an option to retry the save
4. **Given** offline queue is enabled (US4), **When** I save a task while offline, **Then** I see a notification that the task has been queued for later

---

### User Story 4 - Offline Queue (Priority: P2)

As a user, I want my tasks to be saved even when the API is unavailable, so I don't lose work due to temporary network issues.

**Why this priority**: Reliability enhancement - prevents data loss during network hiccups. Important for users who save tasks frequently and rely on immediate feedback.

**Independent Test**: Can be fully tested by disconnecting from the network, saving a task, and verifying it's queued and synced when connectivity returns.

**Acceptance Scenarios**:

1. **Given** I'm offline when saving a task, **When** I initiate the save, **Then** the task is saved to a local queue for later sync
2. **Given** tasks are queued for offline sync, **When** connectivity is restored, **Then** queued tasks are synced to Google Tasks automatically
3. **Given** I have queued tasks, **When** I open the extension popup, **Then** I see a count of pending sync tasks
4. **Given** a queued task sync fails 3 times, **When** 24 hours have passed since the original save attempt, **Then** the task is automatically discarded from the queue

---

### User Story 5 - Duplicate Detection (Priority: P3)

As a user, I want to be warned if I'm about to save a URL that's already in my task list, so I don't create redundant tasks.

**Why this priority**: Reduces clutter and confusion - duplicate URLs are rarely intentional and create maintenance overhead. This is a quality-of-life feature.

**Independent Test**: Can be fully tested by saving a page, then attempting to save the same URL again and verifying the warning appears.

**Acceptance Scenarios**:

1. **Given** I'm saving a URL that already exists in my task list, **When** I initiate the save, **Then** I see a warning that this URL was already saved, with options to "Save Anyway" or "Cancel"
2. **Given** I'm saving a duplicate URL, **When** I choose "Save Anyway", **Then** a new task is created (duplicate allowed if user chooses)
3. **Given** duplicate detection is enabled, **When** I'm saving a URL, **Then** the detection checks both synced tasks and pending queue tasks

---

### User Story 6 - Dark Mode (Priority: P3)

As a user, I want the popup and options page to support dark mode, so it's comfortable to use in low-light environments.

**Why this priority**: Accessibility and user preference - dark mode is expected in modern applications. Reduces eye strain for users in dark environments.

**Independent Test**: Can be fully tested by toggling system dark mode preference and verifying the UI updates accordingly.

**Acceptance Scenarios**:

1. **Given** my system is set to dark mode, **When** I open the extension popup, **Then** the UI displays in dark mode automatically
2. **Given** my system is set to light mode, **When** I open the extension popup, **Then** the UI displays in light mode automatically
3. **Given** the options page is open, **When** I toggle between light/dark mode, **Then** the UI updates to match my preference

---

### Edge Cases

- **Edge Case 1**: What happens when the note text exceeds the maximum length supported by Google Tasks API?
- **Edge Case 2**: How does the system handle a due date that's far in the future (e.g., 5+ years)?
- **Edge Case 3**: What happens when the user loses connectivity mid-sync of multiple queued tasks?
- **Edge Case 4**: How is duplicate detection handled when tasks are in the offline queue but not yet synced?
- **Edge Case 5**: What happens to queued tasks if the user clears browser storage?
- **Edge Case 6**: How does dark mode interact with high-contrast or accessibility themes?

## Requirements

### Functional Requirements

- **FR-001**: Users MUST be able to add a text note to a task before saving (notes only available in popup mode, not quick-save)
- **FR-002**: Users MUST be able to select a due date from a date picker when saving a task
- **FR-003**: System MUST display a success notification within 2 seconds of task creation
- **FR-004**: System MUST display an error notification with meaningful message when task creation fails
- **FR-005**: System MUST queue failed task saves locally when offline or API errors occur
- **FR-006**: System MUST automatically retry syncing queued tasks when connectivity is restored
- **FR-007**: System MUST warn users when attempting to save a URL that already exists in their task list
- **FR-008**: System MUST follow system dark/light mode preference automatically
- **FR-009**: System MUST persist offline queue across browser sessions
- **FR-010**: System MUST retry queued tasks up to 3 times before discarding
- **FR-011**: System MUST discard queued tasks after 24 hours from original save attempt

### Key Entities

- **TaskNote**: A text annotation attached to a task, containing the user's free-form notes
- **DueDate**: A date value indicating when the task should be completed
- **OfflineQueue**: A collection of pending tasks that failed to sync, awaiting retry
- **QueuedTask**: An individual task in the offline queue with metadata (timestamp, retry count, status, expiry time)
- **DuplicateWarning**: A notification shown when a URL matches an existing task

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can add a note to a task in under 5 seconds from popup open
- **SC-002**: Due date picker loads within 500ms of clicking the date field
- **SC-003**: Success/error notifications appear within 2 seconds of task save attempt
- **SC-004**: Offline queue persists at least 100 tasks without performance degradation
- **SC-005**: Queued tasks sync automatically within 30 seconds of connectivity restoration
- **SC-006**: Duplicate detection completes within 500ms per URL check
- **SC-007**: Dark mode switches within 200ms of system preference change
- **SC-008**: 95% of task saves complete successfully with appropriate user feedback
- **SC-009**: Zero data loss for tasks saved during offline periods (once synced)

## Assumptions

- System-following dark mode via `prefers-color-scheme` media query
- Notes field limited to Google Tasks API maximum (1024 characters)
- Due dates limited to reasonable range (today through 5 years in future)
- Offline queue uses browser storage with size limits
- Duplicate detection is URL-based (exact match)
