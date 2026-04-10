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
  logout,
  isAuthenticated
} from '@/services/auth'

describe('Auth Service', () => {
  beforeEach(() => {
    resetChromeMocks()
  })

  describe('getToken', () => {
    it('should use getAuthToken when interactive=true', async () => {
      const token = await getToken(true)

      expect(token).toBe(DEFAULT_MOCK_TOKEN)
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

    it('should return null when getAuthToken returns error', async () => {
      chromeIdentity.getAuthToken.mockImplementation((_details: unknown, callback?: (result: chrome.identity.GetAuthTokenResult) => void) => {
        chromeRuntime.lastError = { message: 'User not signed in' }
        if (callback) callback({})
        return Promise.resolve({} as chrome.identity.GetAuthTokenResult)
      })

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

  describe('logout', () => {
    it('should remove cached token and revoke on Google', async () => {
      // Mock fetch for revocation endpoint
      const mockFetch = vi.fn().mockResolvedValue({ ok: true })
      global.fetch = mockFetch

      await logout()

      expect(chromeIdentity.removeCachedAuthToken).toHaveBeenCalled()
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('accounts.google.com/o/oauth2/revoke')
      )

      // Clean up
      delete (global as Record<string, unknown>).fetch
    })

    it('should do nothing when no token available', async () => {
      simulateNoToken()

      await logout()

      expect(chromeIdentity.removeCachedAuthToken).not.toHaveBeenCalled()
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
