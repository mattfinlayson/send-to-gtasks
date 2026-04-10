/**
 * Duplicate Detection Service
 * Checks if a URL has already been saved as a task
 */

import { normalizeUrl } from '../utils/url'
import { getOfflineQueue, getSavedUrls } from './storage'

/**
 * Result of a duplicate check
 */
export interface DuplicateCheckResult {
  isDuplicate: boolean
  matchedIn: 'synced' | 'queue' | 'both' | null
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
