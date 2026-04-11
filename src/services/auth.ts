/**
 * Auth Service
 * Handles Google OAuth2 authentication via chrome.identity API.
 *
 * Uses chrome.identity.getAuthToken() which works with the Chrome Extension
 * client type in Google Cloud Console — no redirect URI configuration needed.
 */

/**
 * Extract token string from getAuthToken result.
 * Handles both old API (returns string) and new API (returns GetAuthTokenResult).
 */
function extractToken(result: unknown): string | null {
  if (typeof result === 'string') {
    return result || null
  }
  if (result && typeof result === 'object' && 'token' in result) {
    return (result as { token?: string }).token ?? null
  }
  return null
}

/**
 * Get an OAuth2 access token via chrome.identity.getAuthToken.
 * - interactive=true: Shows account picker / consent screen if needed
 * - interactive=false: Returns cached token silently, or null
 */
export async function getToken(interactive: boolean): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.identity.getAuthToken({ interactive }, (result) => {
      if (chrome.runtime.lastError) {
        console.error('getAuthToken error:', chrome.runtime.lastError.message)
        resolve(null)
        return
      }
      resolve(extractToken(result))
    })
  })
}

/**
 * Remove a cached token, forcing re-auth on next getToken call.
 * Call this when API returns 401 to invalidate an expired token.
 */
export async function removeToken(token: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.identity.removeCachedAuthToken({ token }, () => {
      resolve()
    })
  })
}

/**
 * Full logout: remove cached token and revoke it on Google's side.
 * This ensures the next interactive getToken shows the account picker.
 */
export async function logout(): Promise<void> {
  const token = await getToken(false)
  if (!token) return

  // Remove from Chrome's local cache
  await removeToken(token)

  // Revoke on Google's side so next login shows consent/account picker
  try {
    await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`)
  } catch {
    // Best-effort — network may be down
  }
}

/**
 * Check if user is authenticated (has valid cached token).
 * Uses non-interactive mode to avoid showing consent UI.
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const token = await getToken(false)
    return token !== null
  } catch {
    return false
  }
}
