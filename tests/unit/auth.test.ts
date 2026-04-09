import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  resetChromeMocks,
  chromeIdentity,
  chromeRuntime,
  simulateAuthError,
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
    it('should return token when authentication succeeds', async () => {
      const token = await getToken(true)

      expect(token).toBe(DEFAULT_MOCK_TOKEN)
      expect(chromeIdentity.getAuthToken).toHaveBeenCalledWith(
        { interactive: true },
        expect.any(Function)
      )
    })

    it('should pass interactive option correctly', async () => {
      await getToken(false)

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

    it('should throw error when chrome.runtime.lastError is set', async () => {
      chromeIdentity.getAuthToken.mockImplementation(((_details: unknown, callback?: (token?: string) => void) => {
        chromeRuntime.lastError = { message: 'OAuth2 not granted or revoked' }
        if (callback) callback(undefined)
        return Promise.resolve(undefined as unknown as string)
      }) as typeof chromeIdentity.getAuthToken)

      await expect(getToken(true)).rejects.toThrow('OAuth2 not granted or revoked')
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
      chromeIdentity.getAuthToken.mockImplementation(((_details: unknown, callback?: (token?: string) => void) => {
        chromeRuntime.lastError = { message: 'User not signed in' }
        if (callback) callback(undefined)
        return Promise.resolve(undefined as unknown as string)
      }) as typeof chromeIdentity.getAuthToken)

      const result = await isAuthenticated()

      expect(result).toBe(false)
    })
  })
})
