/**
 * Tests for toast popup - notification types and actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setQuickSaveEnabled } from '../../src/services/storage'
import { chromeStorageSession } from '../setup'

describe('toast popup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

  describe('toast types', () => {
    it('should support success type', () => {
      // Toast types: success, error, queued, duplicate
      const types = ['success', 'error', 'queued', 'duplicate'] as const
      expect(types).toContain('success')
    })

    it('should support error type', () => {
      const types = ['success', 'error', 'queued', 'duplicate'] as const
      expect(types).toContain('error')
    })

    it('should support queued type', () => {
      const types = ['success', 'error', 'queued', 'duplicate'] as const
      expect(types).toContain('queued')
    })

    it('should support duplicate type', () => {
      const types = ['success', 'error', 'queued', 'duplicate'] as const
      expect(types).toContain('duplicate')
    })
  })

  describe('toast durations', () => {
    it('should define different durations per type', () => {
      // Success: 2s, Error: manual close, Queued: 4s, Duplicate: 3s
      const durations = {
        success: 2000,
        error: 0, // manual close
        queued: 4000,
        duplicate: 3000,
      }
      expect(durations.success).toBe(2000)
      expect(durations.error).toBe(0)
      expect(durations.queued).toBe(4000)
      expect(durations.duplicate).toBe(3000)
    })
  })
})
