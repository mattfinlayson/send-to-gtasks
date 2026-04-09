/**
 * Tests for toast popup - session storage integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setQuickSaveEnabled } from '../../src/services/storage'
import { chromeStorageSession } from '../setup'

describe('toast popup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset chrome.runtime.lastError
    vi.stubGlobal('chrome', {
      ...chrome,
      runtime: {
        ...chrome.runtime,
        lastError: undefined,
      },
    })
  })

  describe('quick save session storage', () => {
    it('should reset quick save mode to false', async () => {
      await setQuickSaveEnabled(false)

      expect(chromeStorageSession.set).toHaveBeenCalled()
      const call = chromeStorageSession.set.mock.calls[0]
      expect(call[0]).toEqual({ quick_save_enabled: false })
    })

    it('should enable quick save mode', async () => {
      await setQuickSaveEnabled(true)

      expect(chromeStorageSession.set).toHaveBeenCalled()
      const call = chromeStorageSession.set.mock.calls[0]
      expect(call[0]).toEqual({ quick_save_enabled: true })
    })
  })
})
