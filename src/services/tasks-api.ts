/**
 * Tasks API Service
 * Handles Google Tasks API operations
 */

import {
  type AppError,
  TASKS_API_BASE_URL,
  type TaskCreateRequest,
  type TaskList,
  type TaskResponse,
} from '../types'
import { getCachedLists, isCacheValid, setCachedLists } from './storage'

/**
 * Custom error class for API errors
 */
class TasksAPIError extends Error {
  constructor(
    public code: AppError['code'],
    message: string,
    public retryable: boolean = false,
  ) {
    super(message)
    this.name = 'TasksAPIError'
  }
}

/**
 * Create a new task in the specified list
 * @param token - OAuth2 access token
 * @param listId - Task list ID (use '@default' for primary list)
 * @param task - Task creation request
 * @returns Created task response
 * @throws TasksAPIError with appropriate error code
 */
export async function createTask(
  token: string,
  listId: string,
  task: TaskCreateRequest,
): Promise<TaskResponse> {
  const url = `${TASKS_API_BASE_URL}/tasks/v1/lists/${encodeURIComponent(listId)}/tasks`

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    })
  } catch {
    throw new TasksAPIError('NETWORK_ERROR', 'Failed to connect to Google Tasks API', true)
  }

  if (!response.ok) {
    await handleErrorResponse(response)
  }

  try {
    return (await response.json()) as TaskResponse
  } catch {
    throw new TasksAPIError('API_ERROR', 'Failed to parse API response', false)
  }
}

/**
 * Handle error responses from the API
 */
async function handleErrorResponse(response: Response): Promise<never> {
  const status = response.status

  switch (status) {
    case 401:
      throw new TasksAPIError(
        'AUTH_REQUIRED',
        'Authentication required. Please sign in again.',
        false,
      )

    case 403:
      throw new TasksAPIError(
        'PERMISSION_DENIED',
        'Access denied. You may need to re-authorize the extension.',
        false,
      )

    case 429:
      throw new TasksAPIError('RATE_LIMITED', 'Too many requests. Please try again later.', true)

    case 404:
      throw new TasksAPIError(
        'LIST_NOT_FOUND',
        'The selected task list was not found. It may have been deleted.',
        false,
      )

    default:
      throw new TasksAPIError('API_ERROR', `API error: ${status}`, status >= 500)
  }
}

/**
 * Get all task lists for the authenticated user
 * @param token - OAuth2 access token
 * @param forceRefresh - Skip cache and fetch fresh data
 * @returns Array of task lists
 * @throws TasksAPIError with appropriate error code
 */
export async function getTaskLists(
  token: string,
  forceRefresh: boolean = false,
): Promise<TaskList[]> {
  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cachedLists = await getCachedLists()
    if (isCacheValid(cachedLists)) {
      return cachedLists.lists
    }
  }

  const url = `${TASKS_API_BASE_URL}/tasks/v1/users/@me/lists?maxResults=100`

  let response: Response
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  } catch {
    throw new TasksAPIError('NETWORK_ERROR', 'Failed to connect to Google Tasks API', true)
  }

  if (!response.ok) {
    await handleErrorResponse(response)
  }

  const data = await response.json()
  const lists: TaskList[] = data.items || []

  // Cache the results
  await setCachedLists(lists)

  return lists
}

export { TasksAPIError }
