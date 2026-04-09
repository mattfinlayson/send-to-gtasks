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

      // Now restore normal mock for interactive sign-in
      chromeIdentity.getAuthToken.mockImplementation(((details: { interactive: boolean }, callback?: (token?: string) => void) => {
        if (details.interactive) {
          // User completes sign-in
          if (callback) callback('new-user-token')
          return Promise.resolve('new-user-token')
        }
        if (callback) callback(undefined)
        return Promise.resolve(undefined as unknown as string)
      }) as typeof chromeIdentity.getAuthToken)

      // Interactive sign-in should succeed
      const token = await getToken(true)
      expect(token).toBe('new-user-token')
    })
  })

  describe('Returning user authentication flow', () => {
    it('should use cached token without prompting', async () => {
      // User already has a valid token cached
      const cachedToken = 'cached-token-xyz'
      chromeIdentity.getAuthToken.mockImplementation((details, callback) => {
        if (callback) callback(cachedToken)
        return Promise.resolve(cachedToken)
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

      // Then get a fresh token
      chromeIdentity.getAuthToken.mockImplementation((details, callback) => {
        if (callback) callback(newToken)
        return Promise.resolve(newToken)
      })

      const token = await getToken(false)
      expect(token).toBe(newToken)
    })
  })

  describe('User revokes access flow', () => {
    it('should handle revoked access gracefully', async () => {
      // Simulate revoked access error
      chromeIdentity.getAuthToken.mockImplementation(((_details: unknown, callback?: (token?: string) => void) => {
        chromeRuntime.lastError = { message: 'OAuth2 not granted or revoked' }
        if (callback) callback(undefined)
        return Promise.resolve(undefined as unknown as string)
      }) as typeof chromeIdentity.getAuthToken)

      // isAuthenticated should return false
      const isAuthed = await isAuthenticated()
      expect(isAuthed).toBe(false)

      // getToken with interactive should throw
      await expect(getToken(true)).rejects.toThrow('OAuth2 not granted or revoked')
    })
  })
})
