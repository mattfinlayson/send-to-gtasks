import { describe, it, expect, beforeEach } from 'vitest'
import {
  resetChromeMocks,
  chromeIdentity,
  chromeRuntime,
  simulateNoToken,
  DEFAULT_MOCK_TOKEN
} from '../setup'
import { getToken, removeToken, isAuthenticated } from '@/services/auth'

describe('Auth Flow Integration', () => {
  beforeEach(() => {
    resetChromeMocks()
  })

  describe('First-time user authentication flow', () => {
    it('should prompt for sign-in when user clicks extension for first time', async () => {
      // Simulate no existing token (first time user)
      simulateNoToken()

      // Check auth status - should be false
      const isAuthed = await isAuthenticated()
      expect(isAuthed).toBe(false)

      // Mock launchWebAuthFlow for interactive sign-in
      const newToken = 'new-user-token'
      chromeIdentity.launchWebAuthFlow.mockResolvedValue(
        `https://extension.chromiumapp.org/callback#access_token=${newToken}&token_type=Bearer`
      )

      // Interactive sign-in should succeed
      const token = await getToken(true)
      expect(token).toBe(newToken)
    })
  })

  describe('Returning user authentication flow', () => {
    it('should use cached token without prompting', async () => {
      // User already has a valid token cached
      const cachedToken = 'cached-token-xyz'
      chromeIdentity.getAuthToken.mockImplementation((details, callback) => {
        if (callback) callback({ token: cachedToken })
        return Promise.resolve({ token: cachedToken })
      })

      // Non-interactive should return the cached token
      const token = await getToken(false)
      expect(token).toBe(cachedToken)

      // isAuthenticated should also return true
      const isAuthed = await isAuthenticated()
      expect(isAuthed).toBe(true)
    })
  })

  describe('Token expiration and refresh flow', () => {
    it('should handle token invalidation and re-authentication', async () => {
      const expiredToken = 'expired-token'
      const newToken = 'fresh-token'

      // First, remove the expired token
      await removeToken(expiredToken)
      expect(chromeIdentity.removeCachedAuthToken).toHaveBeenCalledWith(
        { token: expiredToken },
        expect.any(Function)
      )

      // Then get a fresh token non-interactively
      chromeIdentity.getAuthToken.mockImplementation((details, callback) => {
        if (callback) callback({ token: newToken })
        return Promise.resolve({ token: newToken })
      })

      const token = await getToken(false)
      expect(token).toBe(newToken)
    })
  })

  describe('User revokes access flow', () => {
    it('should handle revoked access gracefully', async () => {
      // Simulate revoked access error on getAuthToken
      chromeIdentity.getAuthToken.mockImplementation((_details: unknown, callback?: (result: chrome.identity.GetAuthTokenResult) => void) => {
        chromeRuntime.lastError = { message: 'OAuth2 not granted or revoked' }
        if (callback) callback({})
        return Promise.resolve({} as chrome.identity.GetAuthTokenResult)
      })

      // isAuthenticated should return false
      const isAuthed = await isAuthenticated()
      expect(isAuthed).toBe(false)

      // getToken with interactive should return null (launchWebAuthFlow handles errors gracefully)
      chromeIdentity.launchWebAuthFlow.mockRejectedValue(new Error('OAuth2 not granted or revoked'))
      
      const token = await getToken(true)
      expect(token).toBeNull()
    })
  })
})
