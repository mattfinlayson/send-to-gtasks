import { describe, it, expect, beforeEach, vi } from 'vitest'
import { resetChromeMocks, setMockStorage, getMockStorage } from '../setup'
import { createTask, getTaskLists, TasksAPIError } from '@/services/tasks-api'
import type { TaskCreateRequest, TaskResponse, TaskList, CachedTaskLists } from '@/types'

// Mock global fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Tasks API Service', () => {
  beforeEach(() => {
    resetChromeMocks()
    mockFetch.mockReset()
  })

  describe('createTask', () => {
    const mockToken = 'test-auth-token'
    const mockTaskRequest: TaskCreateRequest = {
      title: 'Test Task Title',
      notes: 'https://example.com/test-page'
    }
    const mockTaskResponse: TaskResponse = {
      kind: 'tasks#task',
      id: 'task-123',
      etag: '"abc123"',
      title: mockTaskRequest.title,
      notes: mockTaskRequest.notes,
      updated: '2025-11-25T10:00:00.000Z',
      selfLink: 'https://www.googleapis.com/tasks/v1/lists/@default/tasks/task-123',
      position: '00000000000000000000',
      status: 'needsAction'
    }

    it('should create a task successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockTaskResponse)
      })

      const result = await createTask(mockToken, '@default', mockTaskRequest)

      expect(result).toEqual(mockTaskResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://tasks.googleapis.com/tasks/v1/lists/%40default/tasks',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(mockTaskRequest)
        })
      )
    })

    it('should throw AuthError on 401 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          error: { code: 401, message: 'Invalid credentials', status: 'UNAUTHENTICATED' }
        })
      })

      await expect(createTask(mockToken, '@default', mockTaskRequest))
        .rejects.toMatchObject({ code: 'AUTH_REQUIRED' })
    })

    // T012: HTTP 403 response throws with code: 'PERMISSION_DENIED'
    it('should throw PERMISSION_DENIED on 403 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve({
          error: { code: 403, message: 'Quota exceeded', status: 'PERMISSION_DENIED' }
        })
      })

      await expect(createTask(mockToken, '@default', mockTaskRequest))
        .rejects.toMatchObject({ code: 'PERMISSION_DENIED' })
    })

    it('should throw RateLimitError on 429 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({
          error: { code: 429, message: 'Too many requests', status: 'RESOURCE_EXHAUSTED' }
        })
      })

      await expect(createTask(mockToken, '@default', mockTaskRequest))
        .rejects.toMatchObject({ code: 'RATE_LIMITED' })
    })

    it('should throw ListNotFoundError on 404 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({
          error: { code: 404, message: 'List not found', status: 'NOT_FOUND' }
        })
      })

      await expect(createTask(mockToken, 'non-existent-list', mockTaskRequest))
        .rejects.toMatchObject({ code: 'LIST_NOT_FOUND' })
    })

    it('should throw NetworkError on fetch failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(createTask(mockToken, '@default', mockTaskRequest))
        .rejects.toMatchObject({ code: 'NETWORK_ERROR' })
    })

    // T013: createTask with special listId constructs URL with encodeURIComponent
    it('should URL-encode the listId in the request URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockTaskResponse)
      })

      await createTask(mockToken, 'my list@work', mockTaskRequest)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://tasks.googleapis.com/tasks/v1/lists/my%20list%40work/tasks',
        expect.any(Object)
      )
    })

    // T014: createTask where response.json() throws should reject with code: 'API_ERROR'
    it('should reject with API_ERROR when response.json() throws', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => { throw new SyntaxError('Unexpected token') }
      })

      await expect(createTask(mockToken, '@default', mockTaskRequest))
        .rejects.toMatchObject({ code: 'API_ERROR' })
    })

    it('should include Authorization header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockTaskResponse)
      })

      await createTask(mockToken, '@default', mockTaskRequest)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`
          })
        })
      )
    })

    it('should throw API_ERROR with retryable=true on 5xx response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: { code: 500, message: 'Internal server error' } })
      })

      await expect(createTask(mockToken, '@default', mockTaskRequest))
        .rejects.toMatchObject({ code: 'API_ERROR', retryable: true })
    })
  })

  describe('getTaskLists', () => {
    const mockToken = 'test-auth-token'
    const mockTaskLists: TaskList[] = [
      { id: '@default', title: 'My Tasks', updated: '2025-11-25T10:00:00.000Z' },
      { id: 'list-123', title: 'Work Tasks', updated: '2025-11-25T09:00:00.000Z' }
    ]

    // T015: getTaskLists URL includes ?maxResults=100 query parameter
    it('should include ?maxResults=100 in the URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ kind: 'tasks#taskLists', items: [] })
      })

      await getTaskLists(mockToken)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('?maxResults=100'),
        expect.any(Object)
      )
    })

    it('should fetch task lists successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ kind: 'tasks#taskLists', items: mockTaskLists })
      })

      const result = await getTaskLists(mockToken)
      expect(result).toEqual(mockTaskLists)
    })

    it('should return empty array when no lists exist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ kind: 'tasks#taskLists', items: [] })
      })

      const result = await getTaskLists(mockToken)
      expect(result).toEqual([])
    })

    it('should handle missing items in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ kind: 'tasks#taskLists' })
      })

      const result = await getTaskLists(mockToken)
      expect(result).toEqual([])
    })

    it('should throw AuthError on 401 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: { code: 401 } })
      })

      await expect(getTaskLists(mockToken)).rejects.toMatchObject({ code: 'AUTH_REQUIRED' })
    })

    it('should throw NetworkError on fetch failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(getTaskLists(mockToken)).rejects.toMatchObject({ code: 'NETWORK_ERROR' })
    })

    it('should cache task lists after successful fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ kind: 'tasks#taskLists', items: mockTaskLists })
      })

      await getTaskLists(mockToken)

      const storage = getMockStorage()
      const cached = storage.cachedLists as CachedTaskLists
      expect(cached).toBeDefined()
      expect(cached.lists).toEqual(mockTaskLists)
    })

    it('should return cached lists when cache is valid', async () => {
      const cachedData = { lists: mockTaskLists, cachedAt: Date.now() - 1000 }
      setMockStorage({ cachedLists: cachedData })

      const result = await getTaskLists(mockToken)

      expect(result).toEqual(mockTaskLists)
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should bypass cache when forceRefresh is true', async () => {
      const cachedData = { lists: mockTaskLists, cachedAt: Date.now() - 1000 }
      setMockStorage({ cachedLists: cachedData })

      const freshLists: TaskList[] = [{ ...mockTaskLists[0], title: 'Fresh Tasks' }]
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ kind: 'tasks#taskLists', items: freshLists })
      })

      const result = await getTaskLists(mockToken, true)

      expect(result).toEqual(freshLists)
      expect(mockFetch).toHaveBeenCalled()
    })
  })

  // T011: TasksAPIError message property equals the human string (second constructor arg)
  describe('TasksAPIError', () => {
    it('should set message to the human-readable string, not the code', () => {
      const err = new TasksAPIError('AUTH_REQUIRED', 'Authentication required.', false)

      expect(err.message).toBe('Authentication required.')
      expect(err.message).not.toBe('AUTH_REQUIRED')
      expect(err.code).toBe('AUTH_REQUIRED')
    })
  })
})
