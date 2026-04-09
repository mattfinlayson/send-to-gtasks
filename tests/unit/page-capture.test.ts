import { describe, it, expect, beforeEach } from 'vitest'
import { resetChromeMocks, chromeTabs, createMockTab } from '../setup'
import { getCurrentTab, extractPageInfo, truncateTitle } from '@/services/page-capture'
import { MAX_TITLE_LENGTH } from '@/types'

describe('Page Capture Service', () => {
  beforeEach(() => {
    resetChromeMocks()
  })

  describe('getCurrentTab', () => {
    it('should return the current active tab', async () => {
      const tab = await getCurrentTab()

      expect(tab).toBeDefined()
      expect(tab!.id).toBe(1)
      expect(tab!.url).toBe('https://example.com/test-page')
      expect(tab!.title).toBe('Test Page Title')
      expect(chromeTabs.query).toHaveBeenCalledWith(
        { active: true, currentWindow: true },
        expect.any(Function)
      )
    })

    it('should return undefined when no active tab', async () => {
      chromeTabs.query.mockImplementation((_queryInfo: unknown, callback?: (tabs: chrome.tabs.Tab[]) => void) => {
        if (callback) callback([])
        return Promise.resolve([])
      })

      const tab = await getCurrentTab()

      expect(tab).toBeUndefined()
    })
  })

  describe('extractPageInfo', () => {
    it('should extract URL and title from tab', () => {
      const tab = createMockTab({ url: 'https://example.com/page', title: 'Example Page' })

      const info = extractPageInfo(tab)

      expect(info).toEqual({
        url: 'https://example.com/page',
        title: 'Example Page'
      })
    })

    it('should use URL domain when title is empty', () => {
      const tab = createMockTab({ url: 'https://example.com/page', title: '' })

      const info = extractPageInfo(tab)

      expect(info.title).toBe('example.com')
    })

    it('should use URL domain when title is undefined', () => {
      const tab = createMockTab({ url: 'https://subdomain.example.com/path', title: undefined })

      const info = extractPageInfo(tab)

      expect(info.title).toBe('subdomain.example.com')
    })

    // T076: whitespace-only title should trigger domain fallback
    it('should use URL domain when title is whitespace-only', () => {
      const tab = createMockTab({ url: 'https://example.com/page', title: '   ' })

      const info = extractPageInfo(tab)

      expect(info.title).toBe('example.com')
    })

    it('should use full URL when cannot extract domain', () => {
      const tab = createMockTab({ url: 'invalid-url', title: undefined })

      const info = extractPageInfo(tab)

      expect(info.title).toBe('invalid-url')
    })

    it('should truncate long titles', () => {
      const longTitle = 'A'.repeat(MAX_TITLE_LENGTH + 100)
      const tab = createMockTab({ url: 'https://example.com', title: longTitle })

      const info = extractPageInfo(tab)

      expect(info.title.length).toBeLessThanOrEqual(MAX_TITLE_LENGTH)
      expect(info.title).toMatch(/\.\.\.$/i)
    })

    it('should handle URL being undefined', () => {
      const tab = createMockTab({ url: undefined, title: 'Some Title' })

      const info = extractPageInfo(tab)

      expect(info.url).toBe('')
      expect(info.title).toBe('Some Title')
    })
  })

  describe('truncateTitle', () => {
    it('should not truncate short titles', () => {
      const title = 'Short Title'

      const result = truncateTitle(title)

      expect(result).toBe(title)
    })

    it('should truncate long titles with ellipsis', () => {
      const longTitle = 'A'.repeat(MAX_TITLE_LENGTH + 50)

      const result = truncateTitle(longTitle)

      expect(result.length).toBe(MAX_TITLE_LENGTH)
      expect(result).toMatch(/\.\.\.$/i)
    })

    it('should truncate at word boundary when possible', () => {
      // Create a title that's too long but has word boundaries
      const words = 'This is a very long title that needs to be truncated '.repeat(30)

      const result = truncateTitle(words)

      expect(result.length).toBeLessThanOrEqual(MAX_TITLE_LENGTH)
      expect(result).toMatch(/\.\.\.$/i)
    })
  })
})
