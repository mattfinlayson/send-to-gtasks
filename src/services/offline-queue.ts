/**
 * Offline Queue Service
 * Handles queuing tasks when offline and syncing when back online
 */

import { MAX_RETRY_COUNT, QUEUE_EXPIRY_MS, type QueuedTask, type OfflineQueue } from '../types'
import {
  getOfflineQueue,
  setOfflineQueue,
  dequeueTask,
  updateQueuedTaskStatus,
  getPreferences,
} from './storage'
import { createTaskFromOptions } from './task-creation'
import { getToken } from './auth'

/**
 * Sync all pending tasks in the offline queue
 * Called when connectivity is restored or on alarm trigger
 */
export async function syncOfflineQueue(): Promise<{ synced: number; failed: number }> {
  const queue = await getOfflineQueue()
  let synced = 0
  let failed = 0

  for (const task of queue.tasks) {
    if (task.status === 'pending' || task.status === 'failed') {
      try {
        await updateQueuedTaskStatus(task.id, 'syncing')
        await createTaskFromOptions({
          title: task.title,
          url: task.url,
          notes: task.notes,
          dueDate: task.dueDate,
          taskListId: task.taskListId,
        })
        await dequeueTask(task.id)
        synced++
      } catch (error) {
        const shouldRetry = task.retryCount < MAX_RETRY_COUNT
        await updateQueuedTaskStatus(task.id, shouldRetry ? 'pending' : 'failed', true)
        failed++
      }
    }
  }

  // Update last sync timestamp
  const updatedQueue = await getOfflineQueue()
  updatedQueue.lastSyncAt = Date.now()
  await setOfflineQueue(updatedQueue)

  return { synced, failed }
}

/**
 * Cleanup expired tasks from the queue
 * Tasks expire after 24 hours from creation
 */
export async function cleanupExpiredTasks(): Promise<number> {
  const queue = await getOfflineQueue()
  const now = Date.now()
  const originalCount = queue.tasks.length

  queue.tasks = queue.tasks.filter((task) => {
    // Keep tasks that haven't expired
    const isExpired = now - task.createdAt > QUEUE_EXPIRY_MS
    // Also remove tasks that exceeded retry count
    const exceededRetries = task.retryCount >= MAX_RETRY_COUNT
    return !isExpired && !exceededRetries
  })

  const removedCount = originalCount - queue.tasks.length
  if (removedCount > 0) {
    await setOfflineQueue(queue)
  }

  return removedCount
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{ pending: number; failed: number }> {
  const queue = await getOfflineQueue()
  return {
    pending: queue.tasks.filter((t) => t.status === 'pending').length,
    failed: queue.tasks.filter((t) => t.status === 'failed').length,
  }
}

/**
 * Check if there are any pending tasks in the queue
 */
export async function hasPendingTasks(): Promise<boolean> {
  const queue = await getOfflineQueue()
  return queue.tasks.some((t) => t.status === 'pending')
}

/**
 * Initialize the offline queue on extension install/update
 */
export async function initializeOfflineQueue(): Promise<void> {
  // Cleanup any expired tasks on startup
  await cleanupExpiredTasks()
}
