/**
 * Popup Script
 * Handles the popup UI and task creation flow
 */

import { getToken, isAuthenticated } from '../services/auth'
import { addSavedUrl } from '../services/storage'
import { createTaskFromOptions } from '../services/task-creation'
import { isAppError, MAX_NOTES_LENGTH } from '../types'

// DOM Elements
let taskForm: HTMLFormElement | null
let notesInput: HTMLTextAreaElement | null
let notesCounter: HTMLElement | null
let dueDateInput: HTMLInputElement | null
let dateWarning: HTMLElement | null
let loadingContainer: HTMLElement | null
let errorContainer: HTMLElement | null
let errorMessageElement: HTMLElement | null
let retryButton: HTMLElement | null
let successContainer: HTMLElement | null
let authContainer: HTMLElement | null
let signinButton: HTMLElement | null

/**
 * Initialize DOM element references.
 * Exported for testing.
 */
export function initElements(): void {
  taskForm = document.getElementById('task-form') as HTMLFormElement
  notesInput = document.getElementById('notes-input') as HTMLTextAreaElement
  notesCounter = document.getElementById('notes-counter')
  dueDateInput = document.getElementById('due-date-picker') as HTMLInputElement
  dateWarning = document.getElementById('date-warning')
  loadingContainer = document.getElementById('loading-container')
  errorContainer = document.getElementById('error-container')
  errorMessageElement = document.getElementById('error-message')
  retryButton = document.getElementById('retry-button')
  successContainer = document.getElementById('success-container')
  authContainer = document.getElementById('auth-container')
  signinButton = document.getElementById('signin-button')
}

/**
 * Set up date input constraints
 */
function setupDateInput(): void {
  if (!dueDateInput) return

  const today = new Date()
  const maxDate = new Date()
  maxDate.setFullYear(today.getFullYear() + 5)

  // Set min date to today
  dueDateInput.min = today.toISOString().split('T')[0]
  // Set max date to +5 years
  dueDateInput.max = maxDate.toISOString().split('T')[0]
}

/**
 * Handle notes input change - update counter
 */
function handleNotesInput(): void {
  if (!notesInput || !notesCounter) return
  const count = notesInput.value.length
  notesCounter.textContent = `${count}/${MAX_NOTES_LENGTH}`
}

/**
 * Handle due date change - show warning for past dates
 */
function handleDueDateChange(): void {
  if (!dueDateInput || !dateWarning) return

  const selectedDate = new Date(dueDateInput.value)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (selectedDate < today) {
    dateWarning.classList.remove('hidden')
  } else {
    dateWarning.classList.add('hidden')
  }
}

/**
 * Show auth state (not signed in)
 */
function showAuth(): void {
  authContainer?.classList.remove('hidden')
  taskForm?.classList.add('hidden')
  loadingContainer?.classList.add('hidden')
  errorContainer?.classList.add('hidden')
  successContainer?.classList.add('hidden')
}

/**
 * Show loading state
 */
function showLoading(): void {
  authContainer?.classList.add('hidden')
  taskForm?.classList.add('hidden')
  loadingContainer?.classList.remove('hidden')
  errorContainer?.classList.add('hidden')
  successContainer?.classList.add('hidden')
}

/**
 * Show form state
 */
function showForm(): void {
  authContainer?.classList.add('hidden')
  taskForm?.classList.remove('hidden')
  loadingContainer?.classList.add('hidden')
  errorContainer?.classList.add('hidden')
  successContainer?.classList.add('hidden')
}

/**
 * Notify service worker of result
 */
function notifyServiceWorker(type: 'TASK_CREATED' | 'TASK_ERROR'): void {
  chrome.runtime.sendMessage({ type }).catch((error) => {
    // Service worker inactive — badge update is best-effort
    console.debug('Could not notify service worker:', error?.message)
  })
}

/**
 * Show success state
 */
function showSuccess(): void {
  taskForm?.classList.add('hidden')
  loadingContainer?.classList.add('hidden')
  errorContainer?.classList.add('hidden')
  successContainer?.classList.remove('hidden')

  // Notify service worker to show badge
  notifyServiceWorker('TASK_CREATED')

  // Auto-close popup after short delay
  setTimeout(() => {
    window.close()
  }, 1500)
}

/**
 * Show error state with message
 */
function showError(message: string): void {
  taskForm?.classList.add('hidden')
  loadingContainer?.classList.add('hidden')
  successContainer?.classList.add('hidden')
  errorContainer?.classList.remove('hidden')

  if (errorMessageElement) {
    errorMessageElement.textContent = message
  }
}

/**
 * Get user-friendly error message from error code.
 * Exported for testing.
 */
export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    switch (error.code) {
      case 'AUTH_REQUIRED':
        return 'Please sign in to your Google account.'
      case 'PERMISSION_DENIED':
        return 'Access denied. You may need to re-authorize the extension.'
      case 'RATE_LIMITED':
        return 'Too many requests. Please try again later.'
      case 'LIST_NOT_FOUND':
        return 'The selected task list was not found.'
      case 'NETWORK_ERROR':
        return 'Unable to connect. Check your internet connection.'
      case 'API_ERROR':
        return 'Something went wrong. Please try again.'
      default:
        return error.message || 'An unexpected error occurred.'
    }
  }

  if (error instanceof Error) {
    if (error.message === 'No active tab found') {
      return 'Could not access the current page.'
    }
    if (error.message === 'Failed to get authentication token') {
      return 'Please sign in to your Google account.'
    }
    return error.message
  }

  return 'An unexpected error occurred.'
}

/**
 * Get current tab info and create task with form data
 */
async function createTaskWithForm(): Promise<void> {
  // Get current tab info
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.url || !tab?.title) {
    showError('Could not access the current page.')
    return
  }

  // Get form values
  const notes = notesInput?.value || ''
  const dueDate = dueDateInput?.value || undefined

  showLoading()

  try {
    await createTaskFromOptions({
      title: tab.title,
      url: tab.url,
      notes: notes || undefined,
      dueDate: dueDate || undefined,
    })
    await addSavedUrl(tab.url)
    showSuccess()
  } catch (error) {
    const message = getErrorMessage(error)
    showError(message)
  }
}

/**
 * Handle retry button click
 */
function handleRetry(): void {
  showForm()
}

/**
 * Handle sign-in button click
 */
async function handleSignIn(): Promise<void> {
  const token = await getToken(true)
  if (token) {
    showForm()
  }
}

/**
 * Initialize popup
 */
async function init(): Promise<void> {
  initElements()
  setupDateInput()

  // Set up event listeners
  notesInput?.addEventListener('input', handleNotesInput)
  dueDateInput?.addEventListener('change', handleDueDateChange)

  // Set up form submission
  taskForm?.addEventListener('submit', (e) => {
    e.preventDefault()
    void createTaskWithForm()
  })

  // Set up retry button
  retryButton?.addEventListener('click', () => {
    handleRetry()
  })

  // Set up sign-in button
  signinButton?.addEventListener('click', () => {
    void handleSignIn()
  })

  // Initialize notes counter
  handleNotesInput()

  // Check auth state — show form or sign-in prompt
  const authed = await isAuthenticated()
  if (authed) {
    showForm()
  } else {
    showAuth()
  }
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
