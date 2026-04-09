/**
 * Quick Save Toast
 * Shows a temporary notification when a task is created via quick save
 */

import { setQuickSaveEnabled } from '../services/storage'

// Toast auto-close duration in milliseconds
const TOAST_DURATION_MS = 2000

/**
 * Display the toast and auto-close after the configured duration
 */
export async function showToast(message: string, isError: boolean = false): Promise<void> {
  const toastElement = document.getElementById('toast')
  const messageElement = document.getElementById('message')

  if (!toastElement || !messageElement) {
    console.error('Toast elements not found')
    return
  }

  // Set message and style
  messageElement.textContent = message
  toastElement.classList.toggle('error', isError)
  toastElement.classList.toggle('success', !isError)

  // Auto-close after duration
  setTimeout(() => {
    toastElement.classList.add('fade-out')
    // Close the toast window after fade animation
    setTimeout(() => {
      window.close()
    }, 200)
  }, TOAST_DURATION_MS)
}

/**
 * Initialize the toast display
 * Parses message from URL query parameters
 */
function init(): void {
  const params = new URLSearchParams(window.location.search)
  const message = params.get('message') || 'Task created'
  const isError = params.get('error') === 'true'

  // Reset quick save mode for next activation
  void setQuickSaveEnabled(false)

  void showToast(decodeURIComponent(message), isError)
}

// Run on DOM ready
init()
