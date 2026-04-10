/**
 * Toast Notification
 * Shows temporary notifications for task creation results
 */

import { TOAST_DURATION_MS } from '../types'
import { setQuickSaveEnabled } from '../services/storage'

type ToastType = 'success' | 'error' | 'queued' | 'duplicate'

interface ToastConfig {
  type: ToastType
  title: string
  message?: string
  duration?: number
  actions?: { label: string; callback: string }[]
}

/**
 * Display toast based on type
 */
export async function showToast(config: ToastConfig): Promise<void> {
  const toastElement = document.getElementById('toast')
  const iconElement = document.getElementById('toast-icon')
  const messageElement = document.getElementById('toast-message')
  const actionsContainer = document.getElementById('toast-actions')

  if (!toastElement || !iconElement || !messageElement) {
    console.error('Toast elements not found')
    return
  }

  // Set type and styles
  toastElement.className = config.type

  // Set icon based on type
  const icons: Record<ToastType, string> = {
    success: '✓',
    error: '✗',
    queued: '⏳',
    duplicate: '⚠',
  }
  iconElement.textContent = icons[config.type] || ''
  messageElement.textContent = config.title

  // Add actions if present
  if (actionsContainer && config.actions) {
    actionsContainer.innerHTML = ''
    for (const action of config.actions) {
      const button = document.createElement('button')
      button.className = `toast-button ${action.callback === 'primary' ? 'primary' : 'secondary'}`
      button.textContent = action.label
      button.addEventListener('click', () => {
        // Send message back to opener
        window.opener?.postMessage({ action: action.callback }, '*')
        window.close()
      })
      actionsContainer.appendChild(button)
    }
  }

  // Get duration
  const duration = config.duration ?? TOAST_DURATION_MS[config.type]

  // Auto-close after duration (0 = manual close)
  if (duration > 0) {
    setTimeout(() => {
      toastElement.classList.add('fade-out')
      setTimeout(() => {
        window.close()
      }, 200)
    }, duration)
  }
}

/**
 * Parse config from URL query parameters and show toast
 */
async function init(): Promise<void> {
  const params = new URLSearchParams(window.location.search)

  const type = (params.get('type') || 'success') as ToastType
  const title = decodeURIComponent(params.get('title') || 'Task created')
  const messageParam = params.get('message')
  const message = messageParam ? decodeURIComponent(messageParam) : undefined
  const duration = params.get('duration') ? parseInt(params.get('duration')!, 10) : undefined

  // Parse actions
  const actions: ToastConfig['actions'] = []
  const actionLabels = params.getAll('action')
  const actionCallbacks = params.getAll('callback')
  for (let i = 0; i < actionLabels.length; i++) {
    actions.push({
      label: decodeURIComponent(actionLabels[i]),
      callback: actionCallbacks[i] || 'close',
    })
  }

  // Reset quick save mode for next activation
  await setQuickSaveEnabled(false)

  await showToast({
    type,
    title,
    message,
    duration,
    actions: actions.length > 0 ? actions : undefined,
  })
}

// Run on DOM ready
void init()
