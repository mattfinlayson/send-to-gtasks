/**
 * Offline Queue Service
 * Handles queuing tasks when offline and syncing when back online
 */

import { MAX_RETRY_COUNT, QUEUE_EXPIRY_MS } from '../types'
import { dequeueTask, getOfflineQueue, setOfflineQueue, updateQueuedTaskStatus } from './storage'
import { createTaskFromOptions } from './task-creation'

/**
 * Key for storing sync lock in session storage
 */
const SYNC_LOCK_KEY = 'offlineQueueSyncLock'

/**
 * Try to acquire the sync lock. Returns true if lock was acquired,
 * false if another sync is already in progress.
 */
async function tryAcquireSyncLock(): Promise<boolean> {
  const result = await chrome.storage.session.get([SYNC_LOCK_KEY])
  const existing = result[SYNC_LOCK_KEY] as number | undefined
  if (existing && existing > Date.now()) {
    return false // another sync is in progress and lock hasn't expired
  }
  // Try to set the lock with a 30-second timeout
  const expiry = Date.now() + 30000
  await chrome.storage.session.set({ [SYNC_LOCK_KEY]: expiry })
  // Double-check we got the lock (another process might have beaten us)
  const verify = await chrome.storage.session.get([SYNC_LOCK_KEY])
  return verify[SYNC_LOCK_KEY] === expiry
}

/**
 * Release the sync lock
 */
async function releaseSyncLock(): Promise<void> {
  await chrome.storage.session.remove(SYNC_LOCK_KEY)
}

/**
 * Check if our lock has expired and clean it up if so
 */
async function cleanupExpiredLock(): Promise<void> {
  const result = await chrome.storage.session.get([SYNC_LOCK_KEY])
  const lockExpiry = result[SYNC_LOCK_KEY] as number | undefined
  if (lockExpiry && lockExpiry < Date.now()) {
    await chrome.storage.session.remove(SYNC_LOCK_KEY)
  }
}

/**
 * Sync all pending tasks in the offline queue
 * Called when connectivity is restored or on alarm trigger
 * Uses a lock to prevent race conditions from concurrent syncs
 */
export async function syncOfflineQueue(): Promise<{ synced: number; failed: number }> {
  // Clean up any expired locks first
  await cleanupExpiredLock()

  // Try to acquire the sync lock
  if (!(await tryAcquireSyncLock())) {
    console.debug('Offline queue sync already in progress, skipping')
    return { synced: 0, failed: 0 }
  }

  try {
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
        } catch (_error) {
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
  } finally {
    await releaseSyncLock()
  }
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
