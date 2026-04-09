/**
 * Popup Script
 * Handles the popup UI and task creation flow
 */

import { createTaskFromCurrentPage } from '../services/task-creation'
import { isAppError } from '../types'

// DOM Elements
let statusElement: HTMLElement | null
let errorContainer: HTMLElement | null
let errorMessageElement: HTMLElement | null
let retryButton: HTMLElement | null
let successContainer: HTMLElement | null
let authContainer: HTMLElement | null
let signInButton: HTMLElement | null

/**
 * Initialize DOM element references.
 * Exported for testing.
 */
export function initElements(): void {
  statusElement = document.getElementById('status')
  errorContainer = document.getElementById('error-container')
  errorMessageElement = document.getElementById('error-message')
  retryButton = document.getElementById('retry-button')
  successContainer = document.getElementById('success-container')
  authContainer = document.getElementById('auth-container')
  signInButton = document.getElementById('sign-in-button')
}

/**
 * Show loading state
 */
function showLoading(): void {
  statusElement?.classList.remove('hidden')
  errorContainer?.classList.add('hidden')
  successContainer?.classList.add('hidden')
  authContainer?.classList.add('hidden')
}

/**
 * Notify service worker of result
 */
function notifyServiceWorker(type: 'TASK_CREATED' | 'TASK_ERROR'): void {
  chrome.runtime.sendMessage({ type }).catch(() => {
    // Service worker inactive — badge update is best-effort
  })
}

/**
 * Show success state
 */
function showSuccess(): void {
  statusElement?.classList.add('hidden')
  errorContainer?.classList.add('hidden')
  authContainer?.classList.add('hidden')
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
  statusElement?.classList.add('hidden')
  successContainer?.classList.add('hidden')
  authContainer?.classList.add('hidden')
  errorContainer?.classList.remove('hidden')

  if (errorMessageElement) {
    errorMessageElement.textContent = message
  }

  // Notify service worker to show error badge
  notifyServiceWorker('TASK_ERROR')
}

/**
 * Show auth state — user needs to sign in.
 * Exported for testing.
 */
export function showAuth(): void {
  statusElement?.classList.add('hidden')
  errorContainer?.classList.add('hidden')
  successContainer?.classList.add('hidden')
  authContainer?.classList.remove('hidden')
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
 * Execute the task creation flow.
 * Exported for testing.
 */
export async function createTask(): Promise<void> {
  showLoading()

  try {
    await createTaskFromCurrentPage()
    showSuccess()
  } catch (error) {
    if (isAppError(error) && error.code === 'AUTH_REQUIRED') {
      showAuth()
      return
    }
    const message = getErrorMessage(error)
    showError(message)
  }
}

/**
 * Handle retry button click
 */
async function handleRetry(): Promise<void> {
  await createTask()
}

/**
 * Initialize popup
 */
function init(): void {
  initElements()

  // Set up retry button
  retryButton?.addEventListener('click', () => {
    void handleRetry()
  })

  // Set up sign-in button — triggers the task creation flow which will acquire token interactively
  signInButton?.addEventListener('click', () => {
    void createTask()
  })

  // Start task creation immediately
  void createTask()
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
