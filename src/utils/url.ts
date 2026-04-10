/**
 * URL Utility Functions
 * Shared utilities for URL manipulation
 */

/**
 * Normalize URL for comparison (remove trailing slash, www prefix, lowercase)
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
