/**
 * Tests for duplicate detection service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { type DuplicateCheckResult, checkDuplicate } from '../../src/services/duplicate-check'
import { normalizeUrl } from '../../src/utils/url'
import { getOfflineQueue, getSavedUrls } from '../../src/services/storage'

// Mock storage module
vi.mock('../../src/services/storage', () => ({
  getOfflineQueue: vi.fn(),
  getSavedUrls: vi.fn()
}))

describe('duplicate detection service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('normalizeUrl', () => {
    it('should lowercase URLs', () => {
      expect(normalizeUrl('HTTPS://EXAMPLE.COM')).toBe('https://example.com')
    })

    it('should remove trailing slash', () => {
      expect(normalizeUrl('https://example.com/page/')).toBe('https://example.com/page')
    })

    it('should remove www prefix', () => {
      expect(normalizeUrl('https://www.example.com')).toBe('https://example.com')
    })

    it('should handle URLs without protocol', () => {
      expect(normalizeUrl('example.com')).toBe('example.com')
    })

    it('should preserve query parameters', () => {
      expect(normalizeUrl('https://example.com/page?q=test')).toBe('https://example.com/page?q=test')
    })

    it('should preserve fragments', () => {
      expect(normalizeUrl('https://example.com/page#section')).toBe('https://example.com/page#section')
    })
  })

  describe('DuplicateCheckResult type', () => {
    it('should support synced match type', () => {
      const result: DuplicateCheckResult = { isDuplicate: true, matchedIn: 'synced' }
      expect(result.isDuplicate).toBe(true)
      expect(result.matchedIn).toBe('synced')
    })

    it('should support queue match type', () => {
      const result: DuplicateCheckResult = { isDuplicate: true, matchedIn: 'queue' }
      expect(result.isDuplicate).toBe(true)
      expect(result.matchedIn).toBe('queue')
    })

    it('should support both match type', () => {
      const result: DuplicateCheckResult = { isDuplicate: true, matchedIn: 'both' }
      expect(result.isDuplicate).toBe(true)
      expect(result.matchedIn).toBe('both')
    })

    it('should support null for non-duplicate', () => {
      const result: DuplicateCheckResult = { isDuplicate: false, matchedIn: null }
      expect(result.isDuplicate).toBe(false)
      expect(result.matchedIn).toBeNull()
    })
  })

  describe('checkDuplicate', () => {
    const baseQueuedTask = {
      id: '1',
      title: 'Test',
      url: 'https://example.com/page',
      status: 'pending' as const,
      taskListId: '@default',
      createdAt: Date.now(),
      lastRetryAt: Date.now(),
      retryCount: 0
    }

    it('should return matchedIn: synced when URL exists in saved URLs', async () => {
      vi.mocked(getSavedUrls).mockResolvedValue({
        urls: ['https://example.com/page'],
        lastUpdated: Date.now()
      })
      vi.mocked(getOfflineQueue).mockResolvedValue({ tasks: [], lastSyncAt: Date.now() })

      const result = await checkDuplicate('https://example.com/page')

      expect(result.isDuplicate).toBe(true)
      expect(result.matchedIn).toBe('synced')
    })

    it('should return matchedIn: queue when URL exists in offline queue', async () => {
      vi.mocked(getSavedUrls).mockResolvedValue({ urls: [], lastUpdated: Date.now() })
      vi.mocked(getOfflineQueue).mockResolvedValue({
        tasks: [{ ...baseQueuedTask }],
        lastSyncAt: Date.now()
      })

      const result = await checkDuplicate('https://example.com/page')

      expect(result.isDuplicate).toBe(true)
      expect(result.matchedIn).toBe('queue')
    })

    it('should return matchedIn: both when URL exists in both saved URLs and queue', async () => {
      vi.mocked(getSavedUrls).mockResolvedValue({
        urls: ['https://example.com/page'],
        lastUpdated: Date.now()
      })
      vi.mocked(getOfflineQueue).mockResolvedValue({
        tasks: [{ ...baseQueuedTask }],
        lastSyncAt: Date.now()
      })

      const result = await checkDuplicate('https://example.com/page')

      expect(result.isDuplicate).toBe(true)
      expect(result.matchedIn).toBe('both')
    })

    it('should return not duplicate when URL not found', async () => {
      vi.mocked(getSavedUrls).mockResolvedValue({ urls: [], lastUpdated: Date.now() })
      vi.mocked(getOfflineQueue).mockResolvedValue({ tasks: [], lastSyncAt: Date.now() })

      const result = await checkDuplicate('https://example.com/new-page')

      expect(result.isDuplicate).toBe(false)
      expect(result.matchedIn).toBeNull()
    })

    it('should normalize URLs before comparison (www prefix)', async () => {
      vi.mocked(getSavedUrls).mockResolvedValue({
        urls: ['https://example.com/page'],
        lastUpdated: Date.now()
      })
      vi.mocked(getOfflineQueue).mockResolvedValue({ tasks: [], lastSyncAt: Date.now() })

      const result = await checkDuplicate('https://www.example.com/page')

      expect(result.isDuplicate).toBe(true)
      expect(result.matchedIn).toBe('synced')
    })

    it('should normalize URLs before comparison (trailing slash)', async () => {
      vi.mocked(getSavedUrls).mockResolvedValue({
        urls: ['https://example.com/page'],
        lastUpdated: Date.now()
      })
      vi.mocked(getOfflineQueue).mockResolvedValue({ tasks: [], lastSyncAt: Date.now() })

      const result = await checkDuplicate('https://example.com/page/')

      expect(result.isDuplicate).toBe(true)
      expect(result.matchedIn).toBe('synced')
    })

    it('should normalize URLs before comparison (case difference)', async () => {
      vi.mocked(getSavedUrls).mockResolvedValue({
        urls: ['https://EXAMPLE.COM/page'],
        lastUpdated: Date.now()
      })
      vi.mocked(getOfflineQueue).mockResolvedValue({ tasks: [], lastSyncAt: Date.now() })

      const result = await checkDuplicate('https://example.com/page')

      expect(result.isDuplicate).toBe(true)
      expect(result.matchedIn).toBe('synced')
    })
  })
})
