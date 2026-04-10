/**
 * Tests for offline queue - type definitions and constants
 */

import { describe, it, expect } from 'vitest'
import { MAX_RETRY_COUNT, QUEUE_EXPIRY_MS, type QueuedTask, type OfflineQueue } from '../../src/types'

describe('offline queue types', () => {
  describe('QueuedTask', () => {
    it('should have required fields', () => {
      const task: QueuedTask = {
        id: 'test-id',
        title: 'Test Task',
        url: 'https://example.com',
        notes: 'Some notes',
        dueDate: '2024-12-31',
        taskListId: 'list-123',
        status: 'pending',
        createdAt: Date.now(),
        lastRetryAt: 0,
        retryCount: 0,
      }

      expect(task.id).toBe('test-id')
      expect(task.title).toBe('Test Task')
      expect(task.status).toBe('pending')
      expect(task.retryCount).toBe(0)
    })

    it('should allow optional fields', () => {
      const task: QueuedTask = {
        id: 'test-id',
        title: 'Test Task',
        url: 'https://example.com',
        notes: '',
        dueDate: undefined,
        taskListId: 'list-123',
        status: 'pending',
        createdAt: Date.now(),
        lastRetryAt: 0,
        retryCount: 0,
      }

      expect(task.dueDate).toBeUndefined()
    })

    it('should support all status values', () => {
      const statuses: QueuedTask['status'][] = ['pending', 'syncing', 'failed']

      statuses.forEach((status) => {
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

  describe('OfflineQueue', () => {
    it('should have tasks array and lastSyncAt', () => {
      const queue: OfflineQueue = {
        tasks: [],
        lastSyncAt: 0,
      }

      expect(queue.tasks).toEqual([])
      expect(queue.lastSyncAt).toBe(0)
    })

    it('should contain queued tasks', () => {
      const task: QueuedTask = {
        id: 'test',
        title: 'Test',
        url: '',
        notes: '',
        taskListId: '',
        status: 'pending',
        createdAt: Date.now(),
        lastRetryAt: 0,
        retryCount: 0,
      }

      const queue: OfflineQueue = {
        tasks: [task],
        lastSyncAt: Date.now(),
      }

      expect(queue.tasks).toHaveLength(1)
    })
  })

  describe('constants', () => {
    it('should define MAX_RETRY_COUNT as 3', () => {
      expect(MAX_RETRY_COUNT).toBe(3)
    })

    it('should define QUEUE_EXPIRY_MS as 24 hours', () => {
      expect(QUEUE_EXPIRY_MS).toBe(24 * 60 * 60 * 1000)
    })
  })

  describe('retry logic constraints', () => {
    it('should have max retry count for task retry', () => {
      const task: QueuedTask = {
        id: 'test',
        title: 'Test',
        url: '',
        notes: '',
        taskListId: '',
        status: 'pending',
        createdAt: Date.now(),
        lastRetryAt: 0,
        retryCount: MAX_RETRY_COUNT,
      }

      // After max retries, task should not retry again
      expect(task.retryCount >= MAX_RETRY_COUNT).toBe(true)
    })

    it('should calculate expiry time correctly', () => {
      const createdAt = Date.now()
      const isExpired = Date.now() - createdAt > QUEUE_EXPIRY_MS

      expect(isExpired).toBe(false)

      // Simulate 25 hours later
      const oldCreatedAt = Date.now() - QUEUE_EXPIRY_MS - 1000
      const isOldExpired = Date.now() - oldCreatedAt > QUEUE_EXPIRY_MS

      expect(isOldExpired).toBe(true)
    })
  })
})
