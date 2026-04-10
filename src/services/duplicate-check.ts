/**
 * Duplicate Detection Service
 * Checks if a URL has already been saved as a task
 */

import { type SavedUrlIndex } from '../types'
import { getSavedUrls, getOfflineQueue } from './storage'

/**
 * Result of a duplicate check
 */
export interface DuplicateCheckResult {
  isDuplicate: boolean
  matchedIn: 'synced' | 'queue' | 'both' | null
}

/**
 * Normalize URL for comparison
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    // Remove trailing slash
    let normalized = parsed.href.endsWith('/') ? parsed.href.slice(0, -1) : parsed.href
    // Remove www prefix for comparison
    normalized = normalized.replace(/^https?:\/\/www\./, 'https://')
    return normalized.toLowerCase()
  } catch {
    return url.toLowerCase()
  }
}

/**
 * Check if a URL is a duplicate (exists in saved URLs or pending queue)
 */
export async function checkDuplicate(url: string): Promise<DuplicateCheckResult> {
  const normalizedUrl = normalizeUrl(url)

  // Check saved URL index
  const urlIndex = await getSavedUrls()
  const savedMatch = urlIndex.urls.some((savedUrl) => normalizeUrl(savedUrl) === normalizedUrl)

  // Check offline queue
  const queue = await getOfflineQueue()
  const queueMatch = queue.tasks.some((task) => normalizeUrl(task.url) === normalizedUrl)

  if (savedMatch && queueMatch) {
    return { isDuplicate: true, matchedIn: 'both' }
  } else if (savedMatch) {
    return { isDuplicate: true, matchedIn: 'synced' }
  } else if (queueMatch) {
    return { isDuplicate: true, matchedIn: 'queue' }
  }

  return { isDuplicate: false, matchedIn: null }
}
