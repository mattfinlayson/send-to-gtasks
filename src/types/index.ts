/**
 * Type definitions for send-to-gtask Chrome Extension
 * Based on data-model.md
 */

// ============================================================================
// Google Tasks API Types
// ============================================================================

/**
 * Task creation request payload
 */
export interface TaskCreateRequest {
  title: string
  notes?: string
}

/**
 * Full task response from API including metadata
 */
export interface TaskResponse {
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

/**
 * Task list from Google Tasks API
 */
export interface TaskList {
  id: string
  title: string
  updated?: string
}

/**
 * Task list response from API
 */
export interface TaskListResponse {
  kind: 'tasks#taskList'
  id: string
  title: string
  updated: string
  selfLink: string
}

/**
 * Response from listing task lists
 */
export interface TaskListsResponse {
  kind: 'tasks#taskLists'
  etag: string
  items: TaskListResponse[]
}

// ============================================================================
// Local Storage Types
// ============================================================================

/**
 * User preferences stored in chrome.storage.local
 */
export interface UserPreferences {
  selectedListId: string
  selectedListTitle: string
}

/**
 * Cached task lists with TTL
 */
export interface CachedTaskLists {
  lists: TaskList[]
  cachedAt: number
}

// ============================================================================
// Page Capture Types
// ============================================================================

/**
 * Information extracted from current tab
 */
export interface PageInfo {
  url: string
  title: string
}

// ============================================================================
// API Error Types
// ============================================================================

/**
 * Application-level error with user-friendly message
 */
export interface AppError {
  code:
    | 'AUTH_REQUIRED'
    | 'AUTH_FAILED'
    | 'PERMISSION_DENIED'
    | 'NETWORK_ERROR'
    | 'API_ERROR'
    | 'RATE_LIMITED'
    | 'LIST_NOT_FOUND'
    | 'UNKNOWN'
  message: string
  retryable: boolean
}

/**
 * Type predicate to check if an unknown value is an AppError
 */
export function isAppError(e: unknown): e is AppError {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    'retryable' in e &&
    typeof (e as Record<string, unknown>).code === 'string'
  )
}

// ============================================================================
// Extension Message Types
// ============================================================================

/**
 * Discriminated union for Chrome runtime messages between popup and service worker
 */
export type ExtensionMessage =
  | { type: 'TASK_CREATED'; tabId?: number }
  | { type: 'TASK_ERROR'; tabId?: number }

// ============================================================================
// Constants
// ============================================================================

/**
 * Default task list ID (Google's special identifier)
 */
export const DEFAULT_LIST_ID = '@default'

/**
 * Default task list display name
 */
export const DEFAULT_LIST_TITLE = 'My Tasks'

/**
 * Maximum title length (Google Tasks API limit)
 */
export const MAX_TITLE_LENGTH = 1024

/**
 * Maximum notes length (Google Tasks API limit)
 */
export const MAX_NOTES_LENGTH = 8192

/**
 * Cache TTL in milliseconds (5 minutes)
 */
export const CACHE_TTL_MS = 5 * 60 * 1000

/**
 * Google Tasks API base URL
 */
export const TASKS_API_BASE_URL = 'https://tasks.googleapis.com'

// ============================================================================
// Default Values
// ============================================================================

/**
 * Default user preferences
 */
export const DEFAULT_PREFERENCES: UserPreferences = {
  selectedListId: DEFAULT_LIST_ID,
  selectedListTitle: DEFAULT_LIST_TITLE,
}
