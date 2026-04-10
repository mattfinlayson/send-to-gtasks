/**
 * Tests for duplicate detection service
 */

import { describe, it, expect } from 'vitest'
import { normalizeUrl, type DuplicateCheckResult } from '../../src/services/duplicate-check'

describe('duplicate detection service', () => {
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
})
