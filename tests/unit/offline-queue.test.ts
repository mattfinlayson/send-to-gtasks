/**
 * Tests for offline queue service - storage layer
 * Tests the storage functions with mocked chrome.storage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MAX_RETRY_COUNT, QUEUE_EXPIRY_MS, type QueuedTask, type OfflineQueue } from '../../src/types'
import {
  getOfflineQueue,
  enqueueTask,
  dequeueTask,
  updateQueuedTaskStatus,
} from '../../src/services/storage'
import { resetChromeMocks, chromeStorageLocal, mockStorage } from '../setup'

describe('offline queue service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetChromeMocks()
    // Clear the shared mockStorage
    Object.keys(mockStorage).forEach(key => delete mockStorage[key])
  })

  describe('getOfflineQueue', () => {
    it('should return empty queue when storage is empty', async () => {
      const queue = await getOfflineQueue()
      expect(queue.tasks).toEqual([])
      expect(queue.lastSyncAt).toBe(0)
    })

    it('should return existing queue from storage', async () => {
      const existingQueue: OfflineQueue = {
        tasks: [{ id: 'test-1', status: 'pending', title: '', url: '', notes: '', taskListId: '', createdAt: 0, lastRetryAt: 0, retryCount: 0 }],
        lastSyncAt: 12345678,
      }
      mockStorage.offlineQueue = existingQueue

      const queue = await getOfflineQueue()
      expect(queue.tasks).toHaveLength(1)
      expect(queue.tasks[0].id).toBe('test-1')
      expect(queue.lastSyncAt).toBe(12345678)
    })
  })

  describe('enqueueTask', () => {
    it('should add task to queue with pending status', async () => {
      const id = await enqueueTask({
        title: 'Test Task',
        url: 'https://example.com',
        notes: 'Test notes',
        dueDate: '2024-12-31',
        taskListId: 'list-123',
      })

      expect(id).toBeTruthy()
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })

    it('should preserve task properties when enqueueing', async () => {
      const id = await enqueueTask({
        title: 'My Task',
        url: 'https://example.com/page',
        notes: 'Important notes',
        dueDate: '2025-01-15',
        taskListId: 'my-list',
      })

      const queue = await getOfflineQueue()
      const task = queue.tasks.find(t => t.id === id)
      
      expect(task).toBeDefined()
      expect(task?.title).toBe('My Task')
      expect(task?.url).toBe('https://example.com/page')
      expect(task?.notes).toBe('Important notes')
      expect(task?.dueDate).toBe('2025-01-15')
      expect(task?.taskListId).toBe('my-list')
      expect(task?.status).toBe('pending')
      expect(task?.retryCount).toBe(0)
    })

    it('should set createdAt timestamp when enqueueing', async () => {
      const before = Date.now()
      const id = await enqueueTask({ title: 'Test', url: '', notes: '', taskListId: '' })
      const after = Date.now()

      const queue = await getOfflineQueue()
      const task = queue.tasks.find(t => t.id === id)
      
      expect(task?.createdAt).toBeGreaterThanOrEqual(before)
      expect(task?.createdAt).toBeLessThanOrEqual(after)
    })

    it('should generate unique IDs for each enqueued task', async () => {
      const id1 = await enqueueTask({ title: 'Task 1', url: '', notes: '', taskListId: '' })
      const id2 = await enqueueTask({ title: 'Task 2', url: '', notes: '', taskListId: '' })
      
      expect(id1).not.toBe(id2)
    })
  })

  describe('dequeueTask', () => {
    it('should remove task from queue by id', async () => {
      const id = await enqueueTask({ title: 'Task 1', url: '', notes: '', taskListId: '' })
      await enqueueTask({ title: 'Task 2', url: '', notes: '', taskListId: '' })

      await dequeueTask(id)

      const queue = await getOfflineQueue()
      expect(queue.tasks).toHaveLength(1)
      expect(queue.tasks[0].title).toBe('Task 2')
    })

    it('should handle removing non-existent task gracefully', async () => {
      await expect(dequeueTask('non-existent-id')).resolves.not.toThrow()
    })
  })

  describe('updateQueuedTaskStatus', () => {
    it('should update task status', async () => {
      const id = await enqueueTask({ title: 'Test', url: '', notes: '', taskListId: '' })

      await updateQueuedTaskStatus(id, 'syncing')

      const queue = await getOfflineQueue()
      const task = queue.tasks.find(t => t.id === id)
      expect(task?.status).toBe('syncing')
    })

    it('should increment retry count when specified', async () => {
      const id = await enqueueTask({ title: 'Test', url: '', notes: '', taskListId: '' })

      await updateQueuedTaskStatus(id, 'pending', true)

      const queue = await getOfflineQueue()
      const task = queue.tasks.find(t => t.id === id)
      expect(task?.retryCount).toBe(1)
    })

    it('should update lastRetryAt when incrementing retry count', async () => {
      const before = Date.now()
      const id = await enqueueTask({ title: 'Test', url: '', notes: '', taskListId: '' })

      await updateQueuedTaskStatus(id, 'pending', true)

      const after = Date.now()
      const queue = await getOfflineQueue()
      const task = queue.tasks.find(t => t.id === id)
      expect(task?.lastRetryAt).toBeGreaterThanOrEqual(before)
      expect(task?.lastRetryAt).toBeLessThanOrEqual(after)
    })

    it('should not increment retry count when not specified', async () => {
      const id = await enqueueTask({ title: 'Test', url: '', notes: '', taskListId: '' })

      await updateQueuedTaskStatus(id, 'syncing')

      const queue = await getOfflineQueue()
      const task = queue.tasks.find(t => t.id === id)
      expect(task?.retryCount).toBe(0)
    })
  })

  describe('constants', () => {
    it('should define MAX_RETRY_COUNT as 3', () => {
      expect(MAX_RETRY_COUNT).toBe(3)
    })

    it('should define QUEUE_EXPIRY_MS as 24 hours in milliseconds', () => {
      expect(QUEUE_EXPIRY_MS).toBe(24 * 60 * 60 * 1000)
      expect(QUEUE_EXPIRY_MS).toBe(86400000)
    })
  })

  describe('QueuedTask type validation', () => {
    it('should accept valid task with all required fields', () => {
      const task: QueuedTask = {
        id: 'test-id',
        title: 'Test Task',
        url: 'https://example.com',
        notes: 'Notes here',
        dueDate: '2025-01-01',
        taskListId: 'list-123',
        status: 'pending',
        createdAt: Date.now(),
        lastRetryAt: Date.now(),
        retryCount: 0,
      }
      
      expect(task.id).toBe('test-id')
      expect(task.status).toBe('pending')
    })

    it('should allow optional dueDate to be undefined', () => {
      const task: QueuedTask = {
        id: 'test',
        title: 'Test',
        url: '',
        notes: '',
        dueDate: undefined,
        taskListId: '',
        status: 'pending',
        createdAt: 0,
        lastRetryAt: 0,
        retryCount: 0,
      }
      
      expect(task.dueDate).toBeUndefined()
    })

    it('should accept all valid status values', () => {
      const statuses: QueuedTask['status'][] = ['pending', 'syncing', 'failed']
      
      statuses.forEach(status => {
        const task: QueuedTask = {
          id: 'test',
          title: 'Test',
          url: '',
          notes: '',
          taskListId: '',
          status,
          createdAt: 0,
          lastRetryAt: 0,
          retryCount: 0,
        }
        expect(task.status).toBe(status)
      })
    })
  })

  describe('retry logic constraints', () => {
    it('should calculate retry eligibility correctly', () => {
      const shouldRetryUnderLimit = (retryCount: number): boolean => {
        return retryCount < MAX_RETRY_COUNT
      }

      expect(shouldRetryUnderLimit(0)).toBe(true)
      expect(shouldRetryUnderLimit(1)).toBe(true)
      expect(shouldRetryUnderLimit(2)).toBe(true)
      expect(shouldRetryUnderLimit(3)).toBe(false)
      expect(shouldRetryUnderLimit(4)).toBe(false)
    })
  })

  describe('expiry logic constraints', () => {
    it('should calculate expiry correctly', () => {
      const isExpired = (createdAt: number): boolean => {
        return Date.now() - createdAt > QUEUE_EXPIRY_MS
      }

      // Fresh task (created now)
      expect(isExpired(Date.now())).toBe(false)

      // Task created 1 hour ago
      const oneHourAgo = Date.now() - (60 * 60 * 1000)
      expect(isExpired(oneHourAgo)).toBe(false)

      // Task created 25 hours ago
      const twentyFiveHoursAgo = Date.now() - (25 * 60 * 60 * 1000)
      expect(isExpired(twentyFiveHoursAgo)).toBe(true)

      // Task created 24+ hours ago (definitely expired)
      const oldTask = Date.now() - QUEUE_EXPIRY_MS - 1
      expect(isExpired(oldTask)).toBe(true)
    })
  })
})
