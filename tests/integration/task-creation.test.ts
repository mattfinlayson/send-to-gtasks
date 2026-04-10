import { describe, it, expect, beforeEach, vi } from 'vitest'
import { resetChromeMocks, chromeTabs, setMockStorage, chromeIdentity, DEFAULT_MOCK_TOKEN, createMockTab, simulateNoToken } from '../setup'
import { createTaskFromCurrentPage } from '@/services/task-creation'
import type { TaskResponse } from '@/types'

// Mock global fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Task Creation Flow Integration', () => {
  beforeEach(() => {
    resetChromeMocks()
    mockFetch.mockReset()
  })

  describe('createTaskFromCurrentPage', () => {
    const mockTaskResponse: TaskResponse = {
      kind: 'tasks#task',
      id: 'task-created-123',
      etag: '"xyz789"',
      title: 'Test Page Title',
      notes: 'https://example.com/test-page',
      updated: '2025-11-25T10:00:00.000Z',
      selfLink: 'https://www.googleapis.com/tasks/v1/lists/@default/tasks/task-created-123',
      position: '00000000000000000000',
      status: 'needsAction'
    }

    it('should create task from current page using default list', async () => {
      // Setup: API returns success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockTaskResponse)
      })

      // Execute: Create task from current page
      const result = await createTaskFromCurrentPage()

      // Verify: Task created with correct page info
      expect(result).toEqual(mockTaskResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://tasks.googleapis.com/tasks/v1/lists/%40default/tasks',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            title: 'Test Page Title',
            notes: '[Saved from: https://example.com/test-page]'
          })
        })
      )
    })

    it('should use user-selected list when preference exists', async () => {
      // Setup: User has selected a custom list
      setMockStorage({
        preferences: {
          selectedListId: 'custom-list-456',
          selectedListTitle: 'My Custom List'
        }
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockTaskResponse)
      })

      // Execute
      await createTaskFromCurrentPage()

      // Verify: Uses custom list (URL-encoded)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://tasks.googleapis.com/tasks/v1/lists/custom-list-456/tasks',
        expect.any(Object)
      )
      // Note: 'custom-list-456' has no special chars so encoding is same
    })

    it('should handle page with no title', async () => {
      // Setup: Tab has no title
      chromeTabs.query.mockImplementation((_queryInfo: unknown, callback?: (tabs: chrome.tabs.Tab[]) => void) => {
        if (callback) {
          callback([createMockTab({ url: 'https://notitle.example.com/page', title: '' })])
        }
        return Promise.resolve([])
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockTaskResponse)
      })

      // Execute
      await createTaskFromCurrentPage()

      // Verify: Uses domain as title
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            title: 'notitle.example.com',
            notes: '[Saved from: https://notitle.example.com/page]'
          })
        })
      )
    })

    it('should throw error when no active tab', async () => {
      // Setup: No active tab
      chromeTabs.query.mockImplementation((_queryInfo: unknown, callback?: (tabs: chrome.tabs.Tab[]) => void) => {
        if (callback) callback([])
        return Promise.resolve([])
      })

      // Execute & Verify
      await expect(createTaskFromCurrentPage()).rejects.toThrow()
    })

    it('should propagate API errors when both attempts return 401', async () => {
      // Setup: API returns 401 on both attempts (initial + retry)
      const unauthorizedResponse = {
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          error: { code: 401, message: 'Invalid credentials', status: 'UNAUTHENTICATED' }
        })
      }
      mockFetch.mockResolvedValueOnce(unauthorizedResponse)
      mockFetch.mockResolvedValueOnce(unauthorizedResponse)

      // Execute & Verify
      await expect(createTaskFromCurrentPage()).rejects.toMatchObject({ code: 'AUTH_REQUIRED' })
    })
  })

  describe('Full user flow', () => {
    it('should complete entire flow: get tab -> get preferences -> create task', async () => {
      // Setup
      const customPrefs = {
        selectedListId: 'reading-list',
        selectedListTitle: 'Reading List'
      }
      setMockStorage({ preferences: customPrefs })

      chromeTabs.query.mockImplementation((_queryInfo: unknown, callback?: (tabs: chrome.tabs.Tab[]) => void) => {
        if (callback) {
          callback([createMockTab({
            id: 42,
            url: 'https://blog.example.com/great-article',
            title: 'Great Article About Something'
          })])
        }
        return Promise.resolve([])
      })

      const expectedResponse: TaskResponse = {
        kind: 'tasks#task',
        id: 'new-task-id',
        etag: '"etag"',
        title: 'Great Article About Something',
        notes: 'https://blog.example.com/great-article',
        updated: '2025-11-25T10:00:00.000Z',
        selfLink: 'https://www.googleapis.com/tasks/v1/lists/reading-list/tasks/new-task-id',
        position: '00000000000000000000',
        status: 'needsAction'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(expectedResponse)
      })

      // Execute
      const result = await createTaskFromCurrentPage()

      // Verify
      expect(result.id).toBe('new-task-id')
      expect(result.title).toBe('Great Article About Something')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('tasks/v1/lists/reading-list/tasks'),
        expect.objectContaining({
          method: 'POST'
        })
      )
    })
  })

  // T017: createTaskFromCurrentPage calls removeToken, acquires fresh token, and succeeds on second call after AUTH_REQUIRED
  describe('401 token refresh retry', () => {
    it('should removeToken and retry with fresh token on AUTH_REQUIRED', async () => {
      // First call returns 401, second call succeeds
      const mockTaskResponse: TaskResponse = {
        kind: 'tasks#task',
        id: 'retried-task',
        etag: '"xyz"',
        title: 'Test Page Title',
        notes: 'https://example.com/test-page',
        updated: '2026-01-01T00:00:00.000Z',
        selfLink: 'https://www.googleapis.com/tasks/v1/lists/@default/tasks/retried-task',
        position: '00000000000000000000',
        status: 'needsAction'
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: { code: 401, message: 'Unauthorized', status: 'UNAUTHENTICATED' } })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockTaskResponse)
        })

      const result = await createTaskFromCurrentPage()

      // Should have succeeded on retry
      expect(result.id).toBe('retried-task')
      // removeToken should have been called (removeCachedAuthToken)
      expect(chromeIdentity.removeCachedAuthToken).toHaveBeenCalledWith(
        { token: DEFAULT_MOCK_TOKEN },
        expect.any(Function)
      )
      // fetch should have been called twice
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  // T018: createTaskFromCurrentPage throws TasksAPIError with code 'AUTH_REQUIRED' (not generic Error) when getToken returns null
  describe('null token handling', () => {
    it('should throw TasksAPIError with AUTH_REQUIRED when token is null', async () => {
      // Make getAuthToken return null (no cached token)
      simulateNoToken()

      await expect(createTaskFromCurrentPage())
        .rejects.toMatchObject({ code: 'AUTH_REQUIRED' })
    })

    it('should re-throw original AUTH_REQUIRED error when refresh token is also null', async () => {
      // Make getAuthToken return null for both calls
      simulateNoToken()

      // First fetch returns 401 (would trigger retry, but token is null)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: { code: 401, message: 'Unauthorized' } })
      })

      await expect(createTaskFromCurrentPage())
        .rejects.toMatchObject({ code: 'AUTH_REQUIRED' })
    })
  })

  describe('non-auth API error propagation', () => {
    it('should propagate non-AUTH_REQUIRED errors without retry', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: { code: 404, message: 'Not found' } })
      })

      await expect(createTaskFromCurrentPage())
        .rejects.toMatchObject({ code: 'LIST_NOT_FOUND' })
      // fetch should only be called once (no retry for non-auth errors)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  // T019: task notes field is truncated to MAX_NOTES_LENGTH when tab.url is longer
  describe('notes length truncation', () => {
    it('should truncate notes to MAX_NOTES_LENGTH when url is very long', async () => {
      const veryLongUrl = 'https://example.com/' + 'a'.repeat(9000)
      chromeTabs.query.mockImplementation((_queryInfo: unknown, callback?: (tabs: chrome.tabs.Tab[]) => void) => {
        if (callback) {
          callback([{
            id: 1, index: 0, pinned: false, highlighted: true, windowId: 1,
            active: true, incognito: false, selected: true, discarded: false,
            autoDiscardable: true, groupId: -1, frozen: false,
            url: veryLongUrl,
            title: 'Long URL Page'
          }])
        }
        return Promise.resolve([])
      })

      const mockTaskResponse: TaskResponse = {
        kind: 'tasks#task',
        id: 'long-url-task',
        etag: '"etag"',
        title: 'Long URL Page',
        notes: veryLongUrl.slice(0, 8192),
        updated: '2026-01-01T00:00:00.000Z',
        selfLink: 'https://www.googleapis.com/tasks/v1/lists/@default/tasks/long-url-task',
        position: '00000000000000000000',
        status: 'needsAction'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockTaskResponse)
      })

      await createTaskFromCurrentPage()

      // Verify the body sent to the API has truncated notes
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body as string)
      expect(callBody.notes.length).toBeLessThanOrEqual(8192)
    })
  })
})
