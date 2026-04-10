/**
 * Shortcut Handler
 * Handles keyboard shortcut commands from Chrome Command API
 */

import { getQuickSaveEnabled } from '../services/storage'
import { createTaskForCurrentPage } from '../services/task-creation'

/**
 * Handle the keyboard shortcut command.
 * Called when user presses the configured shortcut (Ctrl+Shift+K by default).
 *
 * @param command - The command name from Chrome Command API
 */
export async function handleShortcutCommand(command: string): Promise<void> {
  if (command !== '_execute_action') {
    return
  }

  // Check if quick save mode is enabled
  const quickSaveEnabled = await getQuickSaveEnabled()

  if (quickSaveEnabled) {
    // Quick save mode: create task directly without showing popup
    await performQuickSave()
  } else {
    // Normal mode: show the popup (which Chrome handles via _execute_action)
    // The popup will open automatically due to the command definition
    // No additional action needed - Chrome handles showing the action popup
  }
}

/**
 * Perform quick save - create task directly and show toast
 */
async function performQuickSave(): Promise<void> {
  try {
    // Create task for the current active tab
    const task = await createTaskForCurrentPage()

    if (task) {
      // Show success toast
      await showToast(`Task created: ${task.title}`)
    } else {
      // Show error toast
      await showToast('Failed to create task. Check your connection.')
    }
  } catch (error) {
    console.error('Quick save failed:', error)
    await showToast('Failed to create task. Check your connection.')
  }
}

/**
 * Show a toast notification for quick save feedback
 * Uses chrome.alarms instead of setTimeout for MV3 service worker compatibility
 * Service workers can be terminated at any time, so alarms ensure the
 * notification is cleared even if the worker is killed.
 */
async function showToast(message: string): Promise<void> {
  // For now, use chrome.notifications if available
  // This provides a simple notification without needing to open a popup
  if (typeof chrome.notifications !== 'undefined') {
    const notificationId = `quick-save-${Date.now()}`
    chrome.notifications.create(notificationId, {
      type: 'basic',
      iconUrl: 'icons/icon-48.png',
      title: 'Send to Google Tasks',
      message: message,
      priority: 2,
    })

    // Use chrome.alarms instead of setTimeout for MV3 compatibility
    // Schedule notification clear 2 seconds from now
    await chrome.alarms.create(`clear-notification-${notificationId}`, {
      when: Date.now() + 2000,
    })
  }
}
