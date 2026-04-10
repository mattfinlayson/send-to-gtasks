import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  resetChromeMocks,
  chromeIdentity,
  chromeRuntime,
  simulateNoToken,
  DEFAULT_MOCK_TOKEN
} from '../setup'
import {
  getToken,
  removeToken,
  isAuthenticated
} from '@/services/auth'

describe('Auth Service', () => {
  beforeEach(() => {
    resetChromeMocks()
  })

  describe('getToken', () => {
    it('should use getAuthToken when interactive=true', async () => {
      // Mock getAuthToken to return a token when interactive=true
      chromeIdentity.getAuthToken.mockImplementation((details: unknown, callback?: (result: chrome.identity.GetAuthTokenResult) => void) => {
        const params = details as { interactive: boolean }
        if (params.interactive) {
          if (callback) callback({ token: 'interactive-token' })
          return Promise.resolve({ token: 'interactive-token' } as chrome.identity.GetAuthTokenResult)
        }
        // Fallback to default mock
        if (callback) callback({ token: DEFAULT_MOCK_TOKEN })
        return Promise.resolve({ token: DEFAULT_MOCK_TOKEN } as chrome.identity.GetAuthTokenResult)
      })

      const token = await getToken(true)

      expect(token).toBe('interactive-token')
      expect(chromeIdentity.getAuthToken).toHaveBeenCalledWith(
        { interactive: true },
        expect.any(Function)
      )
    })

    it('should use getAuthToken when interactive=false', async () => {
      const token = await getToken(false)

      expect(token).toBe(DEFAULT_MOCK_TOKEN)
      expect(chromeIdentity.getAuthToken).toHaveBeenCalledWith(
        { interactive: false },
        expect.any(Function)
      )
    })

    it('should return null when no token is available', async () => {
      simulateNoToken()

      const token = await getToken(false)

      expect(token).toBeNull()
    })

    it('should remove cached token and get fresh one when interactive=true', async () => {
      // Mock: getAuthToken returns a token, then after remove, returns another
      let callCount = 0
      chromeIdentity.getAuthToken.mockImplementation((details: unknown, callback?: (result: chrome.identity.GetAuthTokenResult) => void) => {
        const params = details as { interactive: boolean }
        callCount++
        if (params.interactive === false) {
          // Non-interactive call - returns cached token
          if (callback) callback({ token: 'cached-token' })
          return Promise.resolve({ token: 'cached-token' } as chrome.identity.GetAuthTokenResult)
        }
        // Interactive call
        if (callback) callback({ token: 'new-token-after-consent' })
        return Promise.resolve({ token: 'new-token-after-consent' } as chrome.identity.GetAuthTokenResult)
      })

      const token = await getToken(true)

      expect(token).toBe('new-token-after-consent')
      expect(chromeIdentity.removeCachedAuthToken).toHaveBeenCalled()
      expect(chromeIdentity.getAuthToken).toHaveBeenCalledTimes(2)
    })
  })

  describe('removeToken', () => {
    it('should call removeCachedAuthToken with the token', async () => {
      const token = 'token-to-remove'

      await removeToken(token)

      expect(chromeIdentity.removeCachedAuthToken).toHaveBeenCalledWith(
        { token },
        expect.any(Function)
      )
    })

    it('should resolve when token is successfully removed', async () => {
      await expect(removeToken('any-token')).resolves.toBeUndefined()
    })
  })

  describe('isAuthenticated', () => {
    it('should return true when a token can be obtained non-interactively', async () => {
      const result = await isAuthenticated()

      expect(result).toBe(true)
      expect(chromeIdentity.getAuthToken).toHaveBeenCalledWith(
        { interactive: false },
        expect.any(Function)
      )
    })

    it('should return false when no token is available', async () => {
      simulateNoToken()

      const result = await isAuthenticated()

      expect(result).toBe(false)
    })

    it('should return false when auth error occurs', async () => {
      chromeIdentity.getAuthToken.mockImplementation((_details: unknown, callback?: (result: chrome.identity.GetAuthTokenResult) => void) => {
        chromeRuntime.lastError = { message: 'User not signed in' }
        if (callback) callback({})
        return Promise.resolve({} as chrome.identity.GetAuthTokenResult)
      })

      const result = await isAuthenticated()

      expect(result).toBe(false)
    })
  })
})
