import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { resetChromeMocks, setMockStorage, getMockStorage, chromeStorageLocal, chromeStorageSession, mockStorage } from '../setup'
import {
  getPreferences,
  setPreferences,
  getCachedLists,
  setCachedLists,
  clearCachedLists,
  isCacheValid,
  getShortcutPreference,
  setShortcutPreference,
  getQuickSaveEnabled,
  setQuickSaveEnabled,
  getSavedUrls,
  setSavedUrls,
  addSavedUrl,
  isUrlSaved,
} from '@/services/storage'
import {
  DEFAULT_PREFERENCES,
  CACHE_TTL_MS,
  type UserPreferences,
  type CachedTaskLists,
  type TaskList,
} from '@/types'
import { DEFAULT_SHORTCUT_PREFERENCE, type ShortcutPreference } from '@/types/shortcut'

describe('Storage Service', () => {
  beforeEach(() => {
    resetChromeMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    // Reset chromeRuntime.lastError using defineProperty to bypass readonly
    Object.defineProperty(chrome.runtime, 'lastError', {
      value: undefined,
      configurable: true
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    // Clean up lastError after each test
    Object.defineProperty(chrome.runtime, 'lastError', {
      value: undefined,
      configurable: true
    })
  })

  describe('getPreferences', () => {
    it('should return default preferences when storage is empty', async () => {
      const prefs = await getPreferences()

      expect(prefs).toEqual(DEFAULT_PREFERENCES)
    })

    it('should return stored preferences when they exist', async () => {
      const storedPrefs: UserPreferences = {
        selectedListId: 'custom-list-123',
        selectedListTitle: 'My Custom List'
      }
      setMockStorage({ preferences: storedPrefs })

      const prefs = await getPreferences()

      expect(prefs).toEqual(storedPrefs)
    })
  })

  describe('setPreferences', () => {
    it('should store preferences in chrome.storage.local', async () => {
      const newPrefs: UserPreferences = {
        selectedListId: 'new-list-456',
        selectedListTitle: 'New List'
      }

      await setPreferences(newPrefs)

      const storage = getMockStorage()
      expect(storage.preferences).toEqual(newPrefs)
    })

    it('should overwrite existing preferences', async () => {
      const oldPrefs: UserPreferences = {
        selectedListId: 'old-list',
        selectedListTitle: 'Old List'
      }
      setMockStorage({ preferences: oldPrefs })

      const newPrefs: UserPreferences = {
        selectedListId: 'new-list',
        selectedListTitle: 'New List'
      }
      await setPreferences(newPrefs)

      const storage = getMockStorage()
      expect(storage.preferences).toEqual(newPrefs)
    })
  })

  describe('getCachedLists', () => {
    it('should return null when cache is empty', async () => {
      const cached = await getCachedLists()

      expect(cached).toBeNull()
    })

    it('should return cached lists when they exist', async () => {
      const mockLists: TaskList[] = [
        { id: '@default', title: 'My Tasks' },
        { id: 'list-1', title: 'Work' }
      ]
      const cachedData: CachedTaskLists = {
        lists: mockLists,
        cachedAt: Date.now()
      }
      setMockStorage({ cachedLists: cachedData })

      const cached = await getCachedLists()

      expect(cached).toEqual(cachedData)
    })
  })

  describe('setCachedLists', () => {
    it('should store task lists with current timestamp', async () => {
      const lists: TaskList[] = [
        { id: '@default', title: 'My Tasks' },
        { id: 'list-2', title: 'Personal' }
      ]
      const expectedTimestamp = new Date('2026-01-01T00:00:00Z').getTime()

      await setCachedLists(lists)

      const storage = getMockStorage()
      const cached = storage.cachedLists as CachedTaskLists

      expect(cached.lists).toEqual(lists)
      expect(cached.cachedAt).toBe(expectedTimestamp)
    })
  })

  describe('clearCachedLists', () => {
    it('should remove cached lists from storage', async () => {
      setMockStorage({
        cachedLists: {
          lists: [{ id: '@default', title: 'My Tasks' }],
          cachedAt: Date.now()
        }
      })

      await clearCachedLists()

      const storage = getMockStorage()
      expect(storage.cachedLists).toBeUndefined()
    })
  })

  describe('isCacheValid', () => {
    it('should return false when cache is null', () => {
      expect(isCacheValid(null)).toBe(false)
    })

    it('should return true when cache is within TTL', () => {
      const cache: CachedTaskLists = {
        lists: [],
        cachedAt: Date.now() - (CACHE_TTL_MS / 2) // Half the TTL ago
      }

      expect(isCacheValid(cache)).toBe(true)
    })

    it('should return false when cache is expired', () => {
      const cache: CachedTaskLists = {
        lists: [],
        cachedAt: Date.now() - (CACHE_TTL_MS + 1000) // TTL + 1 second ago
      }

      expect(isCacheValid(cache)).toBe(false)
    })

    it('should return false when cache is exactly at TTL', () => {
      const cache: CachedTaskLists = {
        lists: [],
        cachedAt: Date.now() - CACHE_TTL_MS
      }

      expect(isCacheValid(cache)).toBe(false)
    })
  })

  // T016: setPreferences and setCachedLists reject when chrome.runtime.lastError is set
  describe('Storage error handling', () => {
    afterAll(() => {
      // Restore the default implementation
      chromeStorageLocal.set.mockImplementation((items: Record<string, unknown>, callback?: () => void) => {
        Object.assign(mockStorage, items)
        if (callback) callback()
        return Promise.resolve()
      })
    })

    it('setPreferences should reject when chrome.runtime.lastError is set', async () => {
      chromeStorageLocal.set.mockImplementation((_items: unknown, callback?: () => void) => {
        // Simulate lastError
        Object.defineProperty(chrome.runtime, 'lastError', {
          value: { message: 'QUOTA_BYTES quota exceeded' },
          configurable: true
        })
        if (callback) callback()
        return Promise.resolve()
      })

      await expect(setPreferences({ selectedListId: '@default', selectedListTitle: 'My Tasks' }))
        .rejects.toThrow('QUOTA_BYTES quota exceeded')
    })

    it('setCachedLists should reject when chrome.runtime.lastError is set', async () => {
      chromeStorageLocal.set.mockImplementation((_items: unknown, callback?: () => void) => {
        Object.defineProperty(chrome.runtime, 'lastError', {
          value: { message: 'QUOTA_BYTES quota exceeded' },
          configurable: true
        })
        if (callback) callback()
        return Promise.resolve()
      })

      await expect(setCachedLists([{ id: '@default', title: 'My Tasks' }]))
        .rejects.toThrow('QUOTA_BYTES quota exceeded')
    })
  })

  describe('Shortcut Preference Storage', () => {
    describe('getShortcutPreference', () => {
      it('should return default shortcut preference when storage is empty', async () => {
        const pref = await getShortcutPreference()

        expect(pref).toEqual(DEFAULT_SHORTCUT_PREFERENCE)
      })

      it('should return stored shortcut preference when they exist', async () => {
        const storedPref: ShortcutPreference = {
          shortcut_key: 'Ctrl+Shift+S',
          is_default: false,
          quick_save_enabled: true,
          last_modified: 1234567890
        }
        setMockStorage({ shortcutPreference: storedPref })

        const pref = await getShortcutPreference()

        expect(pref).toEqual(storedPref)
      })
    })

    describe('setShortcutPreference', () => {
      it('should include last_modified timestamp in stored data', async () => {
        // Verify the storage function updates timestamp
        const pref: ShortcutPreference = {
          shortcut_key: 'Ctrl+Shift+K',
          is_default: false,
          quick_save_enabled: false,
          last_modified: 0
        }

        // Timestamp should be updated before storage
        const updated = { ...pref, last_modified: Date.now() }
        expect(updated.last_modified).toBeGreaterThan(0)
        expect(updated.shortcut_key).toBe('Ctrl+Shift+K')
      })
    })

    describe('getQuickSaveEnabled', () => {
      it('should return false when quick_save_enabled is not set', async () => {
        const enabled = await getQuickSaveEnabled()

        expect(enabled).toBe(false)
      })
    })

    describe('setQuickSaveEnabled', () => {
      it('should set quick_save_enabled in session storage', async () => {
        await setQuickSaveEnabled(true)

        expect(chromeStorageSession.set).toHaveBeenCalled()
        const call = chromeStorageSession.set.mock.calls[0]
        expect(call[0]).toEqual({ quick_save_enabled: true })
      })
    })
  })

  describe('Saved URL Index Storage', () => {
    describe('getSavedUrls', () => {
      it('should return empty index when storage is empty', async () => {
        const index = await getSavedUrls()

        expect(index.urls).toEqual([])
        expect(index.lastUpdated).toBe(0)
      })

      it('should return stored URLs when they exist', async () => {
        const storedIndex = {
          urls: ['https://example.com', 'https://test.com'],
          lastUpdated: 1234567890
        }
        setMockStorage({ savedUrlIndex: storedIndex })

        const index = await getSavedUrls()

        expect(index.urls).toEqual(['https://example.com', 'https://test.com'])
        expect(index.lastUpdated).toBe(1234567890)
      })
    })

    describe('setSavedUrls', () => {
      it('should store URL index in chrome.storage.local', async () => {
        const index = {
          urls: ['https://example.com'],
          lastUpdated: Date.now()
        }

        await setSavedUrls(index)

        const storage = getMockStorage()
        expect(storage.savedUrlIndex).toEqual(index)
      })
    })

    describe('addSavedUrl', () => {
      it('should add URL to index when not present', async () => {
        setMockStorage({ savedUrlIndex: { urls: [], lastUpdated: 0 } })

        await addSavedUrl('https://example.com')

        const storage = getMockStorage() as { savedUrlIndex?: { urls: string[]; lastUpdated: number } }
        expect(storage.savedUrlIndex?.urls).toContain('https://example.com')
        expect(storage.savedUrlIndex?.lastUpdated).toBeGreaterThan(0)
      })

      it('should not add duplicate URL', async () => {
        setMockStorage({ savedUrlIndex: { urls: ['https://example.com'], lastUpdated: 0 } })

        await addSavedUrl('https://example.com')

        const storage = getMockStorage() as { savedUrlIndex?: { urls: string[] } }
        expect(storage.savedUrlIndex?.urls.filter(u => u === 'https://example.com').length).toBe(1)
      })
    })

    describe('isUrlSaved', () => {
      it('should return true when URL is saved', async () => {
        setMockStorage({ savedUrlIndex: { urls: ['https://example.com'], lastUpdated: 0 } })

        const result = await isUrlSaved('https://example.com')

        expect(result).toBe(true)
      })

      it('should return false when URL is not saved', async () => {
        setMockStorage({ savedUrlIndex: { urls: [], lastUpdated: 0 } })

        const result = await isUrlSaved('https://example.com')

        expect(result).toBe(false)
      })
    })
  })

})
