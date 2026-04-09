/**
 * Service Worker
 * Background script for Chrome Extension (Manifest V3)
 *
 * Badge clearing uses chrome.alarms (not setTimeout) so the badge clears
 * even if the service worker is terminated before the delay fires.
 * NOTE: Chrome clamps alarm delays to 1 minute for packed extensions.
 * The badge may persist for up to 1 minute if the service worker is terminated.
 */

import type { ExtensionMessage } from '../types'
import { handleShortcutCommand } from './shortcut-handler'

// Service worker lifecycle events
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Send to Google Tasks extension installed')
  } else if (details.reason === 'update') {
    console.log('Send to Google Tasks extension updated')
  }
})

/**
 * Show success badge on the extension icon.
 * Schedules badge clearing via chrome.alarms for durability.
 */
export function showSuccessBadge(tabId?: number): void {
  const options: chrome.action.BadgeTextDetails = { text: '\u2713' }
  if (tabId) options.tabId = tabId
  void chrome.action.setBadgeText(options)
  void chrome.action.setBadgeBackgroundColor({ color: '#34a853' })

  // Persist badge-clear state and schedule alarm
  void chrome.storage.session.set({ pendingBadgeClear: { tabId } })
  void chrome.alarms.create('clear-badge', { when: Date.now() + 2000 })
}

/**
 * Show error badge on the extension icon.
 * Schedules badge clearing via chrome.alarms for durability.
 */
export function showErrorBadge(tabId?: number): void {
  const options: chrome.action.BadgeTextDetails = { text: '!' }
  if (tabId) options.tabId = tabId
  void chrome.action.setBadgeText(options)
  void chrome.action.setBadgeBackgroundColor({ color: '#ea4335' })

  // Persist badge-clear state and schedule alarm
  void chrome.storage.session.set({ pendingBadgeClear: { tabId } })
  void chrome.alarms.create('clear-badge', { when: Date.now() + 3000 })
}

// Alarm listener — clears badge when 'clear-badge' alarm fires
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'clear-badge') {
    const result = await chrome.storage.session.get(['pendingBadgeClear'])
    const pending = result.pendingBadgeClear as { tabId?: number } | undefined
    const tabId = pending?.tabId

    const clearOptions: chrome.action.BadgeTextDetails = { text: '' }
    if (tabId) clearOptions.tabId = tabId
    void chrome.action.setBadgeText(clearOptions)
    void chrome.storage.session.remove('pendingBadgeClear')
  }
})

// Listen for messages from popup to update badge
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id) return false

  if (message.type === 'TASK_CREATED') {
    showSuccessBadge(message.tabId)
    sendResponse({ success: true })
  } else if (message.type === 'TASK_ERROR') {
    showErrorBadge(message.tabId)
    sendResponse({ success: true })
  }
  return false
})

// Listen for keyboard shortcut commands from Chrome Command API
chrome.commands.onCommand.addListener((command: string) => {
  void handleShortcutCommand(command)
})
