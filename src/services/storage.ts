/**
 * Storage Service
 * Handles chrome.storage.local operations for preferences and cached data
 */

import {
  CACHE_TTL_MS,
  type CachedTaskLists,
  DEFAULT_PREFERENCES,
  type SavedUrlIndex,
  type TaskList,
  type UserPreferences,
} from '../types'
import { DEFAULT_SHORTCUT_PREFERENCE, type ShortcutPreference } from '../types/shortcut'
import { normalizeUrl } from '../utils/url'

/**
 * Get user preferences from storage
 * Returns default preferences if none are stored
 */
export async function getPreferences(): Promise<UserPreferences> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['preferences'], (result) => {
      if (result.preferences) {
        resolve(result.preferences as UserPreferences)
      } else {
        resolve(DEFAULT_PREFERENCES)
      }
    })
  })
}

/**
 * Save user preferences to storage
 */
export async function setPreferences(preferences: UserPreferences): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ preferences }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
      } else {
        resolve()
      }
    })
  })
}

// ============================================================================
// Shortcut Preference Storage
// ============================================================================

/**
 * Get shortcut preferences from storage
 * Returns default preferences if none are stored
 */
export async function getShortcutPreference(): Promise<ShortcutPreference> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['shortcutPreference'], (result) => {
      if (result.shortcutPreference) {
        resolve(result.shortcutPreference as ShortcutPreference)
      } else {
        resolve(DEFAULT_SHORTCUT_PREFERENCE)
      }
    })
  })
}

/**
 * Save shortcut preferences to storage
 */
export async function setShortcutPreference(preference: ShortcutPreference): Promise<void> {
  const updated: ShortcutPreference = {
    ...preference,
    last_modified: Date.now(),
  }
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ shortcutPreference: updated }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
      } else {
        resolve()
      }
    })
  })
}

/**
 * Get quick save preference from session storage (ephemeral)
 */
export async function getQuickSaveEnabled(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.session.get(['quick_save_enabled'], (result) => {
      resolve(result.quick_save_enabled === true)
    })
  })
}

/**
 * Set quick save preference in session storage (ephemeral)
 */
export async function setQuickSaveEnabled(enabled: boolean): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.session.set({ quick_save_enabled: enabled }, () => {
      resolve()
    })
  })
}

// ============================================================================
// Cache Storage
// ============================================================================

/**
 * Get cached task lists from storage
 * Returns null if no cache exists
 */
export async function getCachedLists(): Promise<CachedTaskLists | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['cachedLists'], (result) => {
      if (result.cachedLists) {
        resolve(result.cachedLists as CachedTaskLists)
      } else {
        resolve(null)
      }
    })
  })
}

/**
 * Save task lists to cache with current timestamp
 */
export async function setCachedLists(lists: TaskList[]): Promise<void> {
  const cachedLists: CachedTaskLists = {
    lists,
    cachedAt: Date.now(),
  }
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ cachedLists }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
      } else {
        resolve()
      }
    })
  })
}

/**
 * Clear the cached task lists
 */
export async function clearCachedLists(): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove('cachedLists', () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
      } else {
        resolve()
      }
    })
  })
}

/**
 * Check if cached lists are still valid (within TTL)
 * Type predicate: narrows CachedTaskLists | null to CachedTaskLists
 */
export function isCacheValid(cache: CachedTaskLists | null): cache is CachedTaskLists {
  if (!cache) {
    return false
  }
  const age = Date.now() - cache.cachedAt
  return age < CACHE_TTL_MS
}

// ============================================================================
// Saved URL Index Storage
// ============================================================================

/**
 * Get the saved URL index from storage
 * Returns empty index if none exists
 */
export async function getSavedUrls(): Promise<SavedUrlIndex> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['savedUrlIndex'], (result) => {
      if (result.savedUrlIndex) {
        resolve(result.savedUrlIndex as SavedUrlIndex)
      } else {
        resolve({ urls: [], lastUpdated: 0 })
      }
    })
  })
}

/**
 * Save the saved URL index to storage
 */
export async function setSavedUrls(index: SavedUrlIndex): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ savedUrlIndex: index }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
      } else {
        resolve()
      }
    })
  })
}

/**
 * Add a URL to the saved URL index
 */
export async function addSavedUrl(url: string): Promise<void> {
  const index = await getSavedUrls()
  const normalizedUrl = normalizeUrl(url)
  if (!index.urls.includes(normalizedUrl)) {
    index.urls.push(normalizedUrl)
    index.lastUpdated = Date.now()
    await setSavedUrls(index)
  }
}

/**
 * Check if a URL is in the saved URL index
 */
export async function isUrlSaved(url: string): Promise<boolean> {
  const index = await getSavedUrls()
  const normalizedUrl = normalizeUrl(url)
  return index.urls.includes(normalizedUrl)
}
