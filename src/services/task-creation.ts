/**
 * Task Creation Service
 * Orchestrates the task creation flow
 */

import { isAppError, MAX_NOTES_LENGTH, type TaskResponse } from '../types'
import { enqueueTask } from './storage'
import { getToken, removeToken } from './auth'
import { extractPageInfo, getCurrentTab } from './page-capture'
import { getPreferences } from './storage'
import { createTask, TasksAPIError } from './tasks-api'

/**
 * Options for creating a task
 */
export interface CreateTaskOptions {
  title: string
  url?: string
  notes?: string
  dueDate?: string
  taskListId?: string
}

/**
 * Create a task with extended options
 * @param options Task creation options
 * @returns The created task response
 */
export async function createTaskFromOptions(options: CreateTaskOptions): Promise<TaskResponse> {
  // Get auth token
  const token = await getToken(true)
  if (!token) {
    throw new TasksAPIError('AUTH_REQUIRED', 'Authentication required. Please sign in.', false)
  }

  // Get task list ID
  const listId = options.taskListId || (await getPreferences()).selectedListId

  // Build notes with URL marker
  let notes = options.notes || ''
  if (options.url) {
    const urlMarker = `\n\n[Saved from: ${options.url}]`
    notes = notes ? notes + urlMarker : urlMarker.slice(2)
  }

  // Truncate notes to API limit
  if (notes.length > MAX_NOTES_LENGTH) {
    notes = notes.slice(0, MAX_NOTES_LENGTH - 15) + '... (truncated)'
  }

  const taskRequest: { title: string; notes?: string; due?: string } = {
    title: options.title,
    notes: notes || undefined,
  }

  // Add due date if provided (RFC 3339 format)
  if (options.dueDate) {
    // Ensure RFC 3339 format with time component
    taskRequest.due = options.dueDate.includes('T')
      ? options.dueDate
      : `${options.dueDate}T00:00:00.000Z`
  }

  // Create the task, with offline queue support
  try {
    return await createTask(token, listId, taskRequest)
  } catch (err) {
    // Handle auth errors
    if (isAppError(err) && err.code === 'AUTH_REQUIRED') {
      await removeToken(token)
      const freshToken = await getToken(true)
      if (!freshToken) {
        throw err
      }
      return await createTask(freshToken, listId, taskRequest)
    }

    // Queue task for later if network error (offline support)
    if (isAppError(err) && err.code === 'NETWORK_ERROR' && err.retryable) {
      await enqueueTask({
        title: options.title,
        url: options.url || '',
        notes: options.notes || '',
        dueDate: options.dueDate,
        taskListId: listId,
      })
      // Return null to indicate task was queued (caller should handle this)
      return null as unknown as TaskResponse
    }

    throw err
  }
}

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

/**
 * Create a task from the current page for quick save mode
 * Simplified version that returns just the title for toast feedback
 * @returns Object with title if successful, null otherwise
 */
export async function createTaskForCurrentPage(): Promise<{ title: string } | null> {
  try {
    const task = await createTaskFromCurrentPage()
    return { title: task.title }
  } catch {
    return null
  }
}
