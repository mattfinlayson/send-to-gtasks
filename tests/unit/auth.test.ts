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
    it('should use launchWebAuthFlow when interactive=true', async () => {
      // Mock launchWebAuthFlow to return a URL with a token
      const mockToken = 'mock-access-token'
      const mockRedirectUrl = `https://extension-id.chromiumapp.org/callback#access_token=${mockToken}&token_type=Bearer`
      
      chromeIdentity.launchWebAuthFlow.mockResolvedValue(mockRedirectUrl)

      const token = await getToken(true)

      expect(token).toBe(mockToken)
      expect(chromeIdentity.launchWebAuthFlow).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('accounts.google.com'),
          interactive: true,
        })
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

    it('should return null when launchWebAuthFlow is cancelled', async () => {
      chromeIdentity.launchWebAuthFlow.mockResolvedValue(undefined as unknown as string)

      const token = await getToken(true)

      expect(token).toBeNull()
    })

    it('should return null when launchWebAuthFlow throws', async () => {
      chromeIdentity.launchWebAuthFlow.mockRejectedValue(new Error('User cancelled'))

      const token = await getToken(true)

      expect(token).toBeNull()
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
