/**
 * Options Page Script
 * Handles task list selection and preferences
 */

import { getToken, logout } from '../services/auth'
import {
  getPreferences,
  getQuickSaveEnabled,
  setPreferences,
  setQuickSaveEnabled,
} from '../services/storage'
import { getTaskLists } from '../services/tasks-api'
import type { TaskList, UserPreferences } from '../types'
import { DEFAULT_LIST_ID, DEFAULT_LIST_TITLE, isAppError } from '../types'

// DOM Elements
let loadingElement: HTMLElement | null
let contentElement: HTMLElement | null
let errorElement: HTMLElement | null
let authRequiredElement: HTMLElement | null
let accountEmailElement: HTMLElement | null
let listSelectElement: HTMLSelectElement | null
let refreshButton: HTMLElement | null
let retryButton: HTMLElement | null
let signInButton: HTMLElement | null
let logoutButton: HTMLElement | null
let statusMessage: HTMLElement | null
let errorMessage: HTMLElement | null
let quickSaveToggle: HTMLInputElement | null
let modifierKeyElement: HTMLElement | null

// Current state
let currentLists: TaskList[] = []

/**
 * Initialize DOM element references.
 * Exported for testing.
 */
export function initElements(): void {
  loadingElement = document.getElementById('loading')
  contentElement = document.getElementById('content')
  errorElement = document.getElementById('error')
  authRequiredElement = document.getElementById('auth-required')
  accountEmailElement = document.getElementById('account-email')
  listSelectElement = document.getElementById('list-select') as HTMLSelectElement
  refreshButton = document.getElementById('refresh-button')
  retryButton = document.getElementById('retry-button')
  signInButton = document.getElementById('sign-in-button')
  logoutButton = document.getElementById('logout-button')
  statusMessage = document.getElementById('status-message')
  errorMessage = document.getElementById('error-message')
  quickSaveToggle = document.getElementById('quick-save-toggle') as HTMLInputElement
  modifierKeyElement = document.getElementById('modifier-key-1')
}

/**
 * Show specific UI state
 */
function showState(state: 'loading' | 'content' | 'error' | 'auth'): void {
  loadingElement?.classList.add('hidden')
  contentElement?.classList.add('hidden')
  errorElement?.classList.add('hidden')
  authRequiredElement?.classList.add('hidden')

  switch (state) {
    case 'loading':
      loadingElement?.classList.remove('hidden')
      break
    case 'content':
      contentElement?.classList.remove('hidden')
      break
    case 'error':
      errorElement?.classList.remove('hidden')
      break
    case 'auth':
      authRequiredElement?.classList.remove('hidden')
      break
  }
}

/**
 * Show status message with fade-out animation
 */
function showStatus(message: string, type: 'success' | 'error'): void {
  if (statusMessage) {
    statusMessage.textContent = message
    statusMessage.className = `status-message ${type}`
    statusMessage.classList.remove('hidden')
    statusMessage.classList.remove('fade-out')

    if (type === 'success') {
      setTimeout(() => {
        statusMessage?.classList.add('fade-out')
        setTimeout(() => {
          statusMessage?.classList.add('hidden')
        }, 300)
      }, 2000)
    }
  }
}

/**
 * Load user profile info (email) and display it
 */
async function loadAccountInfo(): Promise<void> {
  if (!accountEmailElement) return

  try {
    const userInfo = await chrome.identity.getProfileUserInfo()
    if (userInfo.email) {
      accountEmailElement.textContent = userInfo.email
    } else {
      accountEmailElement.textContent = 'Signed in'
    }
  } catch (error) {
    console.error('Failed to get profile info:', error)
    accountEmailElement.textContent = 'Signed in'
  }
}

/**
 * Populate the list dropdown
 */
function populateListDropdown(lists: TaskList[], selectedId: string): void {
  const select = listSelectElement
  if (!select) return

  select.innerHTML = ''

  lists.forEach((list) => {
    const option = document.createElement('option')
    option.value = list.id
    option.textContent = list.title
    option.selected = list.id === selectedId
    select.appendChild(option)
  })
}

/**
 * Save selected list preference.
 * Called automatically when dropdown changes.
 */
export async function savePreference(): Promise<void> {
  if (!listSelectElement) return

  const selectedId = listSelectElement.value
  const selectedList = currentLists.find((l) => l.id === selectedId)

  if (!selectedList) {
    showStatus('Please select a valid list', 'error')
    return
  }

  const preferences: UserPreferences = {
    selectedListId: selectedList.id,
    selectedListTitle: selectedList.title,
  }

  try {
    await setPreferences(preferences)
    showStatus('Saved', 'success')
  } catch (error) {
    console.error('Failed to save preferences:', error)
    showStatus('Failed to save', 'error')
  }
}

/**
 * Load task lists and preferences.
 * Exported for testing.
 */
export async function loadData(forceRefresh: boolean = false): Promise<void> {
  showState('loading')

  try {
    // Get auth token (non-interactive first)
    const token = await getToken(false)
    if (!token) {
      showState('auth')
      return
    }

    // Fetch task lists
    currentLists = await getTaskLists(token, forceRefresh)

    // Get current preferences
    const preferences = await getPreferences()

    // Check if selected list still exists
    const selectedListExists = currentLists.some((l) => l.id === preferences.selectedListId)
    const selectedId = selectedListExists ? preferences.selectedListId : DEFAULT_LIST_ID

    // Populate dropdown
    populateListDropdown(currentLists, selectedId)

    // If selection was reset, update preferences
    if (!selectedListExists && preferences.selectedListId !== DEFAULT_LIST_ID) {
      const defaultList = currentLists.find((l) => l.id === DEFAULT_LIST_ID) || currentLists[0]
      await setPreferences({
        selectedListId: defaultList?.id || DEFAULT_LIST_ID,
        selectedListTitle: defaultList?.title || DEFAULT_LIST_TITLE,
      })
      showStatus('Previously selected list not found. Reset to default.', 'error')
    }

    // Load account info and quick save preference
    await loadAccountInfo()
    await loadQuickSavePreference()

    showState('content')
  } catch (error) {
    console.error('Failed to load data:', error)

    if (isAppError(error) && error.code === 'AUTH_REQUIRED') {
      showState('auth')
      return
    }

    if (errorMessage) {
      errorMessage.textContent = 'Failed to load. Please try again.'
    }
    showState('error')
  }
}

/**
 * Handle sign in.
 * Exported for testing.
 */
export async function handleSignIn(): Promise<void> {
  try {
    const token = await getToken(true)
    if (token) {
      await loadData()
    }
  } catch (error) {
    console.error('Sign in failed:', error)
    // Show error in auth state
    const authPrompt = document.querySelector('.auth-prompt')
    if (authPrompt) {
      authPrompt.textContent = 'Sign in failed. Please try again.'
    }
  }
}

/**
 * Handle sign out.
 * Removes cached token and shows auth required state.
 * Exported for testing.
 */
export async function handleSignOut(): Promise<void> {
  try {
    await logout()
  } catch {
    // Ignore errors - proceed with sign out anyway
  }
  showState('auth')
}

/**
 * Handle quick save toggle change.
 * Saves the preference to session storage.
 * Exported for testing.
 */
export async function handleQuickSaveToggle(): Promise<void> {
  if (!quickSaveToggle) return

  const enabled = quickSaveToggle.checked
  try {
    await setQuickSaveEnabled(enabled)
    showStatus(enabled ? 'Quick save enabled' : 'Quick save disabled', 'success')
  } catch (error) {
    console.error('Failed to save quick save preference:', error)
    // Revert toggle to previous state
    quickSaveToggle.checked = !enabled
    showStatus('Failed to save', 'error')
  }
}

/**
 * Load quick save preference and set toggle state.
 * Exported for testing.
 */
export async function loadQuickSavePreference(): Promise<void> {
  const enabled = await getQuickSaveEnabled()
  if (quickSaveToggle) {
    quickSaveToggle.checked = enabled
  }
}

/**
 * Get the platform-specific modifier key
 * Returns "Cmd" for Mac, "Ctrl" otherwise
 */
function getModifierKey(): string {
  const ua = navigator as Navigator & { userAgentData?: { platform?: string } }
  const platform = ua.userAgentData?.platform ?? navigator.platform
  return platform.toLowerCase().includes('mac') ? 'Cmd' : 'Ctrl'
}

/**
 * Set up the keyboard shortcut display
 */
function setupShortcutDisplay(): void {
  const modifier = getModifierKey()

  if (modifierKeyElement) {
    modifierKeyElement.textContent = modifier
  }
}

/**
 * Set refresh button loading state
 */
function setRefreshLoading(loading: boolean): void {
  if (refreshButton) {
    if (loading) {
      refreshButton.classList.add('loading')
    } else {
      refreshButton.classList.remove('loading')
    }
  }
}

/**
 * Initialize options page
 * Exported for testing.
 */
export function init(): void {
  initElements()
  setupShortcutDisplay()

  // Set up event listeners
  listSelectElement?.addEventListener('change', () => {
    void savePreference()
  })
  refreshButton?.addEventListener('click', () => {
    setRefreshLoading(true)
    void loadData(true).finally(() => setRefreshLoading(false))
  })
  retryButton?.addEventListener('click', () => {
    void loadData()
  })
  signInButton?.addEventListener('click', () => {
    void handleSignIn()
  })
  logoutButton?.addEventListener('click', () => {
    void handleSignOut()
  })
  quickSaveToggle?.addEventListener('change', () => {
    void handleQuickSaveToggle()
  })

  // Load initial data
  void loadData()
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
