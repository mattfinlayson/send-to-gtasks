/**
 * Auth Service
 * Handles Google OAuth2 authentication via chrome.identity API
 */

/**
 * Get an OAuth2 access token.
 * - interactive=true: Forces fresh auth by removing cached token first, then prompts
 * - interactive=false: Uses cached token silently
 * @returns The access token, or null if not available
 */
export async function getToken(interactive: boolean): Promise<string | null> {
  if (!interactive) {
    // Non-interactive mode - use cached token via getAuthToken
    return new Promise((resolve) => {
      chrome.identity.getAuthToken({ interactive: false }, (result) => {
        if (chrome.runtime.lastError) {
          resolve(null)
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

  // Interactive mode - remove cached token first to force consent, then prompt
  return new Promise((resolve) => {
    // First, try to get and remove any existing cached token
    chrome.identity.getAuthToken({ interactive: false }, (currentToken) => {
      const token = typeof currentToken === 'string' ? currentToken : currentToken?.token

      if (token) {
        // Remove cached token to force fresh consent
        chrome.identity.removeCachedAuthToken({ token }, () => {
          // Now get a new token with interactive=true (will show consent)
          chrome.identity.getAuthToken({ interactive: true }, (result) => {
            if (chrome.runtime.lastError) {
              resolve(null)
              return
            }
            if (typeof result === 'string') {
              resolve(result || null)
            } else if (result && typeof result === 'object' && 'token' in result) {
              resolve(result.token ?? null)
            } else {
              resolve(null)
            }
          })
        })
      } else {
        // No cached token, just get one with consent
        chrome.identity.getAuthToken({ interactive: true }, (result) => {
          if (chrome.runtime.lastError) {
            resolve(null)
            return
          }
          if (typeof result === 'string') {
            resolve(result || null)
          } else if (result && typeof result === 'object' && 'token' in result) {
            resolve(result.token ?? null)
          } else {
            resolve(null)
          }
        })
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
