/**
 * Page Capture Service
 * Handles extracting page information from browser tabs
 */

import { MAX_TITLE_LENGTH, type PageInfo } from '../types'

/**
 * Get the current active tab
 * @returns The active tab, or undefined if no active tab
 */
export async function getCurrentTab(): Promise<chrome.tabs.Tab | undefined> {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0])
    })
  })
}

/**
 * Extract page info from a tab
 * @param tab - The browser tab
 * @returns PageInfo with URL and title
 */
export function extractPageInfo(tab: chrome.tabs.Tab): PageInfo {
  const url = tab.url ?? ''
  let title = tab.title ?? ''

  // Use URL domain as fallback when title is empty
  if (!title.trim()) {
    title = extractDomain(url) || url
  }

  // Truncate title if too long
  title = truncateTitle(title)

  return { url, title }
}

/**
 * Extract domain from URL
 * @param url - The URL string
 * @returns The domain name, or the original URL if parsing fails
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch {
    return url
  }
}

/**
 * Truncate title to fit within Google Tasks API limit
 * Tries to truncate at word boundary when possible
 * @param title - The original title
 * @returns Truncated title with ellipsis if needed
 */
export function truncateTitle(title: string): string {
  if (title.length <= MAX_TITLE_LENGTH) {
    return title
  }

  // Leave room for ellipsis
  const maxLength = MAX_TITLE_LENGTH - 3

  // Try to truncate at word boundary
  const truncated = title.slice(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')

  if (lastSpace > maxLength * 0.8) {
    // Found a reasonable word boundary
    return `${truncated.slice(0, lastSpace)}...`
  }

  // No good word boundary, just truncate
  return `${truncated}...`
}
