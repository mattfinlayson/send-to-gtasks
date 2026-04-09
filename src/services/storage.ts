/**
 * Storage Service
 * Handles chrome.storage.local operations for preferences and cached data
 */

import {
  CACHE_TTL_MS,
  type CachedTaskLists,
  DEFAULT_PREFERENCES,
  type TaskList,
  type UserPreferences,
} from '../types'

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
