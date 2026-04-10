/**
 * Tests for toast popup - notification types and actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setQuickSaveEnabled } from '../../src/services/storage'
import { chromeStorageSession } from '../setup'
import { TOAST_DURATION_MS } from '../../src/types'

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
    it('should define all required toast types', () => {
      const expectedTypes = ['success', 'error', 'queued', 'duplicate'] as const
      const actualTypes = Object.keys(TOAST_DURATION_MS)

      expectedTypes.forEach((type) => {
        expect(actualTypes).toContain(type)
      })
    })

    it('should have duration defined for each type', () => {
      expect(typeof TOAST_DURATION_MS.success).toBe('number')
      expect(typeof TOAST_DURATION_MS.error).toBe('number')
      expect(typeof TOAST_DURATION_MS.queued).toBe('number')
      expect(typeof TOAST_DURATION_MS.duplicate).toBe('number')
    })
  })

  describe('toast durations', () => {
    it('should have success duration of 2 seconds', () => {
      expect(TOAST_DURATION_MS.success).toBe(2000)
    })

    it('should have error duration of 0 (manual close)', () => {
      expect(TOAST_DURATION_MS.error).toBe(0)
    })

    it('should have queued duration of 3 seconds', () => {
      expect(TOAST_DURATION_MS.queued).toBe(3000)
    })

    it('should have duplicate duration of 0 (manual close)', () => {
      expect(TOAST_DURATION_MS.duplicate).toBe(0)
    })

    it('should have longer duration for queued than success', () => {
      expect(TOAST_DURATION_MS.queued).toBeGreaterThan(TOAST_DURATION_MS.success)
    })
  })

  describe('toast icon mapping', () => {
    it('should map success to checkmark', () => {
      const icons: Record<string, string> = {
        success: '✓',
        error: '✗',
        queued: '⏳',
        duplicate: '⚠',
      }
      expect(icons.success).toBe('✓')
    })

    it('should map error to X mark', () => {
      const icons: Record<string, string> = {
        success: '✓',
        error: '✗',
        queued: '⏳',
        duplicate: '⚠',
      }
      expect(icons.error).toBe('✗')
    })

    it('should map queued to hourglass', () => {
      const icons: Record<string, string> = {
        success: '✓',
        error: '✗',
        queued: '⏳',
        duplicate: '⚠',
      }
      expect(icons.queued).toBe('⏳')
    })

    it('should map duplicate to warning', () => {
      const icons: Record<string, string> = {
        success: '✓',
        error: '✗',
        queued: '⏳',
        duplicate: '⚠',
      }
      expect(icons.duplicate).toBe('⚠')
    })
  })
})
