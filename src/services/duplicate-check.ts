/**
 * Duplicate Detection Service
 * Checks if a URL has already been saved as a task
 */

import { normalizeUrl } from '../utils/url'
import { getSavedUrls } from './storage'

/**
 * Result of a duplicate check
 */
export interface DuplicateCheckResult {
  isDuplicate: boolean
  matchedIn: 'synced' | null
}

/**
 * Check if a URL is a duplicate (exists in saved URLs)
 */
export async function checkDuplicate(url: string): Promise<DuplicateCheckResult> {
  const normalizedUrl = normalizeUrl(url)

  // Check saved URL index
  const urlIndex = await getSavedUrls()
  const savedMatch = urlIndex.urls.some((savedUrl) => normalizeUrl(savedUrl) === normalizedUrl)

  if (savedMatch) {
    return { isDuplicate: true, matchedIn: 'synced' }
  }

  return { isDuplicate: false, matchedIn: null }
}
