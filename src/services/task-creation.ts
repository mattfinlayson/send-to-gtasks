/**
 * Task Creation Service
 * Orchestrates the task creation flow
 */

import { isAppError, MAX_NOTES_LENGTH, type TaskResponse } from '../types'
import { getToken, removeToken } from './auth'
import { extractPageInfo, getCurrentTab } from './page-capture'
import { getPreferences } from './storage'
import { createTask, TasksAPIError } from './tasks-api'

/**
 * Create a task from the current page
 * This is the main flow: get tab info -> get preferences -> create task
 * Handles 401 token expiry with a single retry after token refresh.
 * @returns The created task response
 * @throws TasksAPIError if authentication fails or API call fails
 */
export async function createTaskFromCurrentPage(): Promise<TaskResponse> {
  // Get current tab info
  const tab = await getCurrentTab()
  if (!tab) {
    throw new Error('No active tab found')
  }

  // Extract page info
  const pageInfo = extractPageInfo(tab)

  // Get user preferences for target list
  const preferences = await getPreferences()
  const listId = preferences.selectedListId

  // Get auth token (interactive to prompt if needed)
  const token = await getToken(true)
  if (!token) {
    throw new TasksAPIError('AUTH_REQUIRED', 'Authentication required. Please sign in.', false)
  }

  // Truncate notes to API limit
  const notes = pageInfo.url.slice(0, MAX_NOTES_LENGTH)

  const taskRequest = {
    title: pageInfo.title,
    notes,
  }

  // Create the task, with a single retry on 401 (expired token)
  try {
    return await createTask(token, listId, taskRequest)
  } catch (err) {
    if (isAppError(err) && err.code === 'AUTH_REQUIRED') {
      // Token expired — remove it and get a fresh one
      await removeToken(token)
      const freshToken = await getToken(true)
      if (!freshToken) {
        throw err
      }
      return await createTask(freshToken, listId, taskRequest)
    }
    throw err
  }
}
