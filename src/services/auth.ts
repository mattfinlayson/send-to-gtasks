/**
 * Auth Service
 * Handles Google OAuth2 authentication via chrome.identity API
 */

/**
 * Get an OAuth2 access token
 * @param interactive - If true, show consent UI if needed. Use true for user-initiated actions.
 * @returns The access token, or null if not available
 * @throws Error if authentication fails with an error
 */
export async function getToken(interactive: boolean): Promise<string | null> {
  console.log('[Auth] getToken called, interactive:', interactive)
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, (result) => {
      console.log('[Auth] getAuthToken result:', typeof result === 'string' ? 'string: ' + result : JSON.stringify(result))
      if (chrome.runtime.lastError) {
        console.log('[Auth] lastError:', chrome.runtime.lastError.message)
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      // Handle both old API (returns string) and new API (returns GetAuthTokenResult object)
      if (typeof result === 'string') {
        resolve(result || null)
      } else if (result && typeof result === 'object' && 'token' in result) {
        resolve(result.token ?? null)
      } else {
        resolve(null)
      }
    })
  })
}

/**
 * Remove a cached token, forcing refresh on next getToken call
 * Call this when API returns 401 to invalidate the expired token
 */
export async function removeToken(token: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.identity.removeCachedAuthToken({ token }, () => {
      resolve()
    })
  })
}

/**
 * Check if user is authenticated (has valid cached token)
 * Uses non-interactive mode to avoid showing consent UI
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const token = await getToken(false)
    return token !== null
  } catch {
    return false
  }
}
