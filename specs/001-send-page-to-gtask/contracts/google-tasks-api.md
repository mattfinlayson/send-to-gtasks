# API Contract: Google Tasks API

**Date**: 2025-11-25
**Branch**: `001-send-page-to-gtask`

## Overview

This document specifies the Google Tasks API endpoints used by the send-to-gtask extension. We use a subset of the full API - only what's needed for the feature requirements.

## Base Configuration

| Setting | Value |
|---------|-------|
| Base URL | `https://tasks.googleapis.com` |
| API Version | v1 |
| Auth | OAuth 2.0 Bearer Token |
| Content-Type | application/json |

## Authentication

All requests require an Authorization header:
```
Authorization: Bearer {access_token}
```

Token is obtained via `chrome.identity.getAuthToken()`.

---

## Endpoints

### 1. Create Task

Creates a new task in the specified task list.

**Endpoint**: `POST /tasks/v1/lists/{tasklist}/tasks`

**Used By**: User Story 1 (One-Click Task Creation)

#### Request

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| tasklist | string | Yes | Task list identifier (use `@default` for primary list) |

**Request Body**:
```json
{
  "title": "string (max 1024 chars)",
  "notes": "string (max 8192 chars)"
}
```

**Example Request**:
```http
POST /tasks/v1/lists/@default/tasks HTTP/1.1
Host: tasks.googleapis.com
Authorization: Bearer ya29.xxx
Content-Type: application/json

{
  "title": "How to Build a Chrome Extension - Tutorial",
  "notes": "https://developer.chrome.com/docs/extensions/get-started"
}
```

#### Response

**Success (200 OK)**:
```json
{
  "kind": "tasks#task",
  "id": "MTY4NDg0NzM2NzQ0ODYzNDI3ODc6MDoxNjk0ODQ3Mzg5",
  "etag": "\"LTk0ODQ3MzY3NDQ4NjM0Mjc4Nzo=\"",
  "title": "How to Build a Chrome Extension - Tutorial",
  "notes": "https://developer.chrome.com/docs/extensions/get-started",
  "updated": "2025-11-25T10:30:00.000Z",
  "selfLink": "https://www.googleapis.com/tasks/v1/lists/@default/tasks/xxx",
  "position": "00000000000000000000",
  "status": "needsAction"
}
```

#### Error Responses

| Code | Reason | Action |
|------|--------|--------|
| 401 | Token expired/invalid | Call `removeCachedAuthToken()`, retry with fresh token |
| 403 | Quota exceeded | Show error, implement exponential backoff |
| 404 | List not found | Reset to @default list, retry |
| 429 | Rate limited | Exponential backoff (5s, 10s, 20s) |

---

### 2. List Task Lists

Retrieves all task lists for the authenticated user.

**Endpoint**: `GET /tasks/v1/users/@me/lists`

**Used By**: User Story 3 (Task List Selection)

#### Request

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| maxResults | integer | No | 20 | Max items to return (1-100) |

**Example Request**:
```http
GET /tasks/v1/users/@me/lists?maxResults=100 HTTP/1.1
Host: tasks.googleapis.com
Authorization: Bearer ya29.xxx
```

#### Response

**Success (200 OK)**:
```json
{
  "kind": "tasks#taskLists",
  "etag": "\"xxx\"",
  "items": [
    {
      "kind": "tasks#taskList",
      "id": "@default",
      "title": "My Tasks",
      "updated": "2025-11-25T09:00:00.000Z",
      "selfLink": "https://www.googleapis.com/tasks/v1/users/@me/lists/@default"
    },
    {
      "kind": "tasks#taskList",
      "id": "MTY4NDg0NzM2NzQ0ODYzNDI3ODc6MDow",
      "title": "Reading List",
      "updated": "2025-11-24T15:30:00.000Z",
      "selfLink": "https://www.googleapis.com/tasks/v1/users/@me/lists/xxx"
    }
  ]
}
```

#### Error Responses

| Code | Reason | Action |
|------|--------|--------|
| 401 | Token expired/invalid | Refresh token, retry |
| 403 | Quota exceeded | Show error, retry later |

---

## Rate Limits

| Limit Type | Value | Notes |
|------------|-------|-------|
| Daily quota | 50,000 requests | Per project, very generous |
| Per-user rate | ~10 req/sec | Soft limit, exponential backoff if exceeded |

**Retry Strategy**:
1. On 403/429, wait 5 seconds
2. Retry, if still failing wait 10 seconds
3. Retry, if still failing wait 20 seconds
4. After 3 failures, show user error with manual retry option

---

## TypeScript Interface

```typescript
// API Request/Response types
interface CreateTaskRequest {
  title: string
  notes?: string
}

interface TaskResponse {
  kind: 'tasks#task'
  id: string
  etag: string
  title: string
  notes?: string
  updated: string
  selfLink: string
  position: string
  status: 'needsAction' | 'completed'
}

interface TaskListsResponse {
  kind: 'tasks#taskLists'
  etag: string
  items: TaskListResponse[]
}

interface TaskListResponse {
  kind: 'tasks#taskList'
  id: string
  title: string
  updated: string
  selfLink: string
}

// API Client interface
interface GoogleTasksAPI {
  createTask(listId: string, task: CreateTaskRequest): Promise<TaskResponse>
  getTaskLists(): Promise<TaskListResponse[]>
}
```

---

## Error Response Format

All Google Tasks API errors follow this format:

```json
{
  "error": {
    "code": 401,
    "message": "Request had invalid authentication credentials.",
    "status": "UNAUTHENTICATED",
    "details": [...]
  }
}
```

**Error Handling Pseudocode**:
```
try:
  response = await fetch(endpoint, options)
  if response.status == 401:
    await chrome.identity.removeCachedAuthToken(token)
    token = await chrome.identity.getAuthToken(interactive=false)
    retry once
  if response.status in [403, 429]:
    exponentialBackoff()
  if response.status == 404:
    resetToDefaultList()
    retry once
  if response.ok:
    return response.json()
catch:
  showUserFriendlyError()
```
