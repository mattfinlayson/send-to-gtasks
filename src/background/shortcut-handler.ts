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
 * Perform quick save - create task directly
 */
async function performQuickSave(): Promise<void> {
  try {
    await createTaskForCurrentPage()
  } catch (error) {
    console.error('Quick save failed:', error)
  }
}
