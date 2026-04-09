# Feature Specification: Send Page to Google Tasks

**Feature Branch**: `001-send-page-to-gtask`
**Created**: 2025-11-25
**Status**: Draft
**Input**: User description: "Send page to Google Tasks - Capture current page URL/title and send to a Google Tasks list"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - One-Click Task Creation (Priority: P1)

As a user browsing the web, I want to quickly save the current page as a task in Google Tasks so that I can remember to read or act on it later without interrupting my workflow.

**Why this priority**: This is the core value proposition of the extension. Without this capability, the extension has no purpose. It must work reliably and quickly to be useful.

**Independent Test**: Can be fully tested by clicking the extension icon on any webpage and verifying a task appears in the user's Google Tasks list with the page title and URL.

**Acceptance Scenarios**:

1. **Given** I am on any webpage and signed in to Google, **When** I click the extension icon, **Then** a task is created in my default task list containing the page title as the task name and the URL in the task notes
2. **Given** I am on a webpage with a very long title (>100 characters), **When** I click the extension icon, **Then** the task name is truncated appropriately and the full title is preserved in the notes
3. **Given** I have successfully created a task, **When** the task is created, **Then** I see a brief confirmation notification that the task was saved

---

### User Story 2 - Google Account Authentication (Priority: P2)

As a user, I need to connect my Google account to the extension so that tasks can be created in my personal Google Tasks list.

**Why this priority**: Authentication is required for the extension to function, but it's a one-time setup. The core task creation flow (P1) depends on this being complete.

**Independent Test**: Can be tested by installing the extension fresh, clicking the icon, completing Google sign-in, and verifying the account is connected.

**Acceptance Scenarios**:

1. **Given** I have not connected a Google account, **When** I click the extension icon for the first time, **Then** I am prompted to sign in with Google
2. **Given** I am on the Google sign-in page, **When** I complete authentication, **Then** I am returned to my original page and the extension shows my account is connected
3. **Given** I have previously connected my account, **When** I click the extension icon, **Then** I am not prompted to sign in again (until token expires or I sign out)

---

### User Story 3 - Task List Selection (Priority: P3)

As a user with multiple Google Tasks lists, I want to choose which list to save tasks to so that I can organize my saved pages appropriately.

**Why this priority**: Enhances organization but the extension is fully functional with just the default list. This adds value for power users.

**Independent Test**: Can be tested by selecting a non-default list in settings and verifying new tasks appear in the selected list.

**Acceptance Scenarios**:

1. **Given** I have multiple task lists in Google Tasks, **When** I open the extension settings, **Then** I see a dropdown with all my available task lists
2. **Given** I have selected a specific task list, **When** I create a new task, **Then** the task is created in my selected list (not the default)
3. **Given** my selected list is deleted in Google Tasks, **When** I try to create a task, **Then** I am notified that the list no longer exists and prompted to select a new list

---

### Edge Cases

- What happens when the user is offline? The extension shows an error message indicating no internet connection and the task is not created.
- What happens when Google Tasks API is unavailable? The extension shows an error message with a retry option.
- What happens when the user revokes access in Google account settings? The extension detects the invalid token on next use and prompts for re-authentication.
- What happens on pages where content scripts cannot run (e.g., chrome:// pages, other extensions)? The extension icon shows as disabled/grayed out with a tooltip explaining limitations.
- What happens when the page has no title? The URL domain is used as the task name instead.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Extension MUST capture the current tab's URL and page title when activated
- **FR-002**: Extension MUST authenticate users via Google OAuth to access their Google Tasks
- **FR-003**: Extension MUST create a new task in the user's Google Tasks with the captured page information
- **FR-004**: Task name MUST contain the page title (or URL domain if no title exists)
- **FR-005**: Task notes MUST contain the full page URL
- **FR-006**: Extension MUST display a confirmation when a task is successfully created
- **FR-007**: Extension MUST display clear error messages when task creation fails
- **FR-008**: Extension MUST persist the user's authentication state across browser sessions
- **FR-009**: Extension MUST allow users to select which Google Tasks list to use
- **FR-010**: Extension MUST handle token expiration gracefully by prompting for re-authentication
- **FR-011**: Extension MUST request only the minimum permissions required for functionality

### Key Entities

- **Task**: Represents a Google Tasks item; contains a title (from page title), notes (containing URL), and belongs to a task list
- **Task List**: A Google Tasks list that contains tasks; user can have multiple lists and select one as the target for new tasks
- **User Session**: Represents the authenticated state; contains OAuth tokens and selected preferences (target list)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a task from any standard webpage in under 3 seconds (from click to confirmation)
- **SC-002**: First-time setup (install to first task created) completes in under 2 minutes
- **SC-003**: 95% of task creation attempts succeed on first try (excluding network/auth errors)
- **SC-004**: Extension works on 99% of standard web pages (excluding browser-restricted pages like chrome://)
- **SC-005**: Users can complete the authentication flow in under 30 seconds
- **SC-006**: Extension uses less than 50MB of memory during normal operation

## Assumptions

- Users have an existing Google account with Google Tasks enabled
- Users are using a Chromium-based browser that supports extensions
- The extension will use Google's standard OAuth2 flow for authentication
- Tasks will be created with no due date by default (simplicity principle)
- The extension popup will be minimal - just enough to show status and confirmation
- Error messages will be user-friendly (not technical error codes)
