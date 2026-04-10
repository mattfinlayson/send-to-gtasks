/**
 * Unit tests for shortcut-handler
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { handleShortcutCommand } from '../../src/background/shortcut-handler'

// Mock chrome API
const mockChrome = {
  notifications: {
    create: vi.fn(),
    clear: vi.fn(),
  },
  tabs: {
    query: vi.fn(),
  },
  alarms: {
    create: vi.fn(),
  },
}

// Set up global chrome mock
vi.stubGlobal('chrome', mockChrome)

// Mock the storage and task creation modules
vi.mock('../../src/services/storage', () => ({
  getQuickSaveEnabled: vi.fn(),
  setQuickSaveEnabled: vi.fn(),
}))

vi.mock('../../src/services/task-creation', () => ({
  createTaskForCurrentPage: vi.fn(),
}))

describe('shortcut-handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('handleShortcutCommand', () => {
    it('should do nothing for unknown command', async () => {
      const { getQuickSaveEnabled } = await import('../../src/services/storage')

      await handleShortcutCommand('unknown-command')

      expect(getQuickSaveEnabled).not.toHaveBeenCalled()
    })

    it('should not show popup in normal mode (Chrome handles it)', async () => {
      const { getQuickSaveEnabled } = await import('../../src/services/storage')
      vi.mocked(getQuickSaveEnabled).mockResolvedValue(false)

      await handleShortcutCommand('_execute_action')

      // Chrome handles showing the popup automatically via the command
      // No additional action needed - this is the expected behavior
      expect(getQuickSaveEnabled).toHaveBeenCalled()
    })

    it('should create task directly when quick save is enabled', async () => {
      const { getQuickSaveEnabled } = await import('../../src/services/storage')
      const { createTaskForCurrentPage } = await import('../../src/services/task-creation')

      vi.mocked(getQuickSaveEnabled).mockResolvedValue(true)
      vi.mocked(createTaskForCurrentPage).mockResolvedValue({ title: 'Test Task' })

      await handleShortcutCommand('_execute_action')

      expect(createTaskForCurrentPage).toHaveBeenCalled()
    })

    it('should show error toast when task creation fails in quick save mode', async () => {
      const { getQuickSaveEnabled } = await import('../../src/services/storage')
      const { createTaskForCurrentPage } = await import('../../src/services/task-creation')

      vi.mocked(getQuickSaveEnabled).mockResolvedValue(true)
      vi.mocked(createTaskForCurrentPage).mockResolvedValue(null)

      await handleShortcutCommand('_execute_action')

      expect(createTaskForCurrentPage).toHaveBeenCalled()
      expect(mockChrome.notifications.create).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          title: 'Send to Google Tasks',
          message: expect.stringContaining('Failed to create task'),
        }),
      )
    })
  })
})
