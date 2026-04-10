/**
 * Auth Service
 * Handles Google OAuth2 authentication via chrome.identity API
 */

const CLIENT_ID = '826876690942-meimo9nertd9kah0ftmk16kk15adl5ma.apps.googleusercontent.com'
const SCOPES = 'https://www.googleapis.com/auth/tasks'
const REDIRECT_URI = `https://${chrome.runtime.id}.chromiumapp.org`

/**
 * Get the OAuth authorization URL
 */
function getAuthUrl(forceConsent: boolean = false): string {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', CLIENT_ID)
  url.searchParams.set('redirect_uri', REDIRECT_URI)
  url.searchParams.set('response_type', 'token')
  url.searchParams.set('scope', SCOPES)
  url.searchParams.set('include_granted_scopes', 'true')
  if (forceConsent) {
    url.searchParams.set('prompt', 'consent')
  }
  return url.toString()
}

/**
 * Parse access token from the redirect URL
 */
function parseTokenFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    const fragment = parsed.hash.substring(1)
    const params = new URLSearchParams(fragment)
    return params.get('access_token')
  } catch {
    return null
  }
}

/**
 * Get an OAuth2 access token.
 * - interactive=true: Uses launchWebAuthFlow with force consent (always shows OAuth screen)
 * - interactive=false: Uses getAuthToken with cached token (silent)
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

  // Interactive mode - use launchWebAuthFlow with force consent
  const url = getAuthUrl(true)

  try {
    const resultUrl = await chrome.identity.launchWebAuthFlow({
      url,
      interactive: true,
    })

    if (resultUrl) {
      return parseTokenFromUrl(resultUrl)
    }
    return null
  } catch {
    return null
  }
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
