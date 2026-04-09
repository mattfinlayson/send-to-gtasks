/**
 * Options Page Script
 * Handles task list selection and preferences
 */

import { getToken } from '../services/auth'
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
let listSelectElement: HTMLSelectElement | null
let saveButton: HTMLElement | null
let refreshButton: HTMLElement | null
let retryButton: HTMLElement | null
let signInButton: HTMLElement | null
let statusMessage: HTMLElement | null
let errorMessage: HTMLElement | null
let quickSaveToggle: HTMLInputElement | null

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
  listSelectElement = document.getElementById('list-select') as HTMLSelectElement
  saveButton = document.getElementById('save-button')
  refreshButton = document.getElementById('refresh-button')
  retryButton = document.getElementById('retry-button')
  signInButton = document.getElementById('sign-in-button')
  statusMessage = document.getElementById('status-message')
  errorMessage = document.getElementById('error-message')
  quickSaveToggle = document.getElementById('quick-save-toggle') as HTMLInputElement
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
 * Show status message
 */
function showStatus(message: string, type: 'success' | 'error'): void {
  if (statusMessage) {
    statusMessage.textContent = message
    statusMessage.className = `status-message ${type}`
    statusMessage.classList.remove('hidden')

    if (type === 'success') {
      setTimeout(() => {
        statusMessage?.classList.add('hidden')
      }, 3000)
    }
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
      showStatus('Previously selected list was not found. Reset to default.', 'error')
    }

    showState('content')
  } catch (error) {
    console.error('Failed to load data:', error)

    if (isAppError(error) && error.code === 'AUTH_REQUIRED') {
      showState('auth')
      return
    }

    if (errorMessage) {
      errorMessage.textContent = 'Failed to load task lists. Please try again.'
    }
    showState('error')
  }
}

/**
 * Save selected list preference.
 * Exported for testing.
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
    showStatus('Settings saved!', 'success')
  } catch (error) {
    console.error('Failed to save preferences:', error)
    showStatus('Failed to save settings. Please try again.', 'error')
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
    showStatus('Sign in failed. Please try again.', 'error')
  }
}

/**
 * Handle quick save toggle change.
 * Saves the preference to session storage.
 * Exported for testing.
 */
export async function handleQuickSaveToggle(): Promise<void> {
  if (!quickSaveToggle) return

  const enabled = quickSaveToggle.checked
  await setQuickSaveEnabled(enabled)
  showStatus(enabled ? 'Quick save enabled!' : 'Quick save disabled', 'success')
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
 * Initialize options page
 */
function init(): void {
  initElements()

  // Set up event listeners
  saveButton?.addEventListener('click', savePreference)
  refreshButton?.addEventListener('click', () => loadData(true))
  retryButton?.addEventListener('click', () => loadData())
  signInButton?.addEventListener('click', handleSignIn)
  quickSaveToggle?.addEventListener('change', handleQuickSaveToggle)

  // Load initial data
  void loadData()
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
