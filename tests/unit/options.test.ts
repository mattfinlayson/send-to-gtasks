/**
 * Tests for options.ts
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { resetChromeMocks, setMockStorage } from '../setup'

// Mock the services
vi.mock('@/services/auth', () => ({
  getToken: vi.fn()
}))

vi.mock('@/services/tasks-api', () => ({
  getTaskLists: vi.fn()
}))

vi.mock('@/services/storage', () => ({
  getPreferences: vi.fn(),
  setPreferences: vi.fn()
}))

import { getToken } from '@/services/auth'
import { getTaskLists } from '@/services/tasks-api'
import { getPreferences, setPreferences } from '@/services/storage'

const mockGetToken = vi.mocked(getToken)
const mockGetTaskLists = vi.mocked(getTaskLists)
const mockGetPreferences = vi.mocked(getPreferences)
const mockSetPreferences = vi.mocked(setPreferences)

function setupDOM(): void {
  document.body.innerHTML = `
    <div id="options-container">
      <h1>Send to Google Tasks</h1>
      <div id="loading" class="loading">
        <div class="spinner" aria-hidden="true"></div>
        <span>Loading task lists...</span>
      </div>
      <div id="content" class="content hidden">
        <div class="section">
          <label for="list-select" class="label">Default task list:</label>
          <select id="list-select" class="select">
            <option value="@default">My Tasks</option>
          </select>
        </div>
        <div class="actions">
          <button id="save-button" class="button primary" aria-label="Save selected task list">Save</button>
          <button id="refresh-button" class="button secondary" aria-label="Refresh task lists from Google">Refresh Lists</button>
        </div>
        <div id="status-message" class="status-message hidden" role="status" aria-live="polite"></div>
      </div>
      <div id="error" class="error hidden">
        <p id="error-message"></p>
        <button id="retry-button" class="button primary" aria-label="Retry loading task lists">Retry</button>
      </div>
      <div id="auth-required" class="auth-required hidden">
        <p>Please sign in to your Google account to configure task lists.</p>
        <button id="sign-in-button" class="button primary" aria-label="Sign in with Google">Sign In</button>
      </div>
    </div>
  `
}

describe('Options Page', () => {
  beforeEach(() => {
    resetChromeMocks()
    setupDOM()
    mockGetToken.mockReset()
    mockGetTaskLists.mockReset()
    mockGetPreferences.mockReset()
    mockSetPreferences.mockReset()
  })

  describe('loadData', () => {
    it('should show loading state initially', async () => {
      // Make getToken take a bit so we can observe loading state
      let resolveToken: (v: string | null) => void
      mockGetToken.mockReturnValueOnce(new Promise(r => { resolveToken = r }))
      mockGetPreferences.mockResolvedValue({ selectedListId: '@default', selectedListTitle: 'My Tasks' })
      mockGetTaskLists.mockResolvedValue([])

      const { loadData, initElements } = await import('@/options/options')
      initElements()

      // Start loading (don't await)
      const loadPromise = loadData()

      // Loading indicator should be visible
      expect(document.getElementById('loading')?.classList.contains('hidden')).toBe(false)
      expect(document.getElementById('content')?.classList.contains('hidden')).toBe(true)

      // Resolve to complete
      resolveToken!(null)
      await loadPromise
    })

    it('should show auth state when token is null', async () => {
      mockGetToken.mockResolvedValue(null)

      const { loadData, initElements } = await import('@/options/options')
      initElements()
      await loadData()

      expect(document.getElementById('auth-required')?.classList.contains('hidden')).toBe(false)
      expect(document.getElementById('content')?.classList.contains('hidden')).toBe(true)
    })

    it('should populate dropdown with task lists', async () => {
      mockGetToken.mockResolvedValue('mock-token')
      mockGetPreferences.mockResolvedValue({ selectedListId: '@default', selectedListTitle: 'My Tasks' })
      mockGetTaskLists.mockResolvedValue([
        { id: '@default', title: 'My Tasks' },
        { id: 'work-list', title: 'Work' }
      ])

      const { loadData, initElements } = await import('@/options/options')
      initElements()
      await loadData()

      const select = document.getElementById('list-select') as HTMLSelectElement
      expect(select?.options.length).toBe(2)
      expect(select?.options[0].value).toBe('@default')
      expect(select?.options[1].value).toBe('work-list')
      expect(document.getElementById('content')?.classList.contains('hidden')).toBe(false)
    })

    it('should handle deleted list — reset to default', async () => {
      mockGetToken.mockResolvedValue('mock-token')
      mockGetPreferences.mockResolvedValue({
        selectedListId: 'deleted-list',
        selectedListTitle: 'Deleted List'
      })
      mockGetTaskLists.mockResolvedValue([
        { id: '@default', title: 'My Tasks' }
      ])
      mockSetPreferences.mockResolvedValue(undefined)

      const { loadData, initElements } = await import('@/options/options')
      initElements()
      await loadData()

      // setPreferences should be called with default
      expect(mockSetPreferences).toHaveBeenCalledWith(
        expect.objectContaining({ selectedListId: '@default' })
      )
    })

    it('should show error state on API failure', async () => {
      mockGetToken.mockResolvedValue('mock-token')
      mockGetTaskLists.mockRejectedValue({ code: 'NETWORK_ERROR', message: 'Network error', retryable: true })
      mockGetPreferences.mockResolvedValue({ selectedListId: '@default', selectedListTitle: 'My Tasks' })

      const { loadData, initElements } = await import('@/options/options')
      initElements()
      await loadData()

      expect(document.getElementById('error')?.classList.contains('hidden')).toBe(false)
    })

    it('should show auth state on AUTH_REQUIRED error', async () => {
      mockGetToken.mockResolvedValue('mock-token')
      mockGetTaskLists.mockRejectedValue({ code: 'AUTH_REQUIRED', message: 'Auth required', retryable: false })
      mockGetPreferences.mockResolvedValue({ selectedListId: '@default', selectedListTitle: 'My Tasks' })

      const { loadData, initElements } = await import('@/options/options')
      initElements()
      await loadData()

      expect(document.getElementById('auth-required')?.classList.contains('hidden')).toBe(false)
    })
  })

  describe('savePreference', () => {
    it('should save selected preference and show success message', async () => {
      mockGetToken.mockResolvedValue('mock-token')
      mockGetPreferences.mockResolvedValue({ selectedListId: '@default', selectedListTitle: 'My Tasks' })
      mockGetTaskLists.mockResolvedValue([
        { id: '@default', title: 'My Tasks' },
        { id: 'work-list', title: 'Work' }
      ])
      mockSetPreferences.mockResolvedValue(undefined)

      const { loadData, savePreference, initElements } = await import('@/options/options')
      initElements()
      await loadData()

      // Select the work list
      const select = document.getElementById('list-select') as HTMLSelectElement
      select.value = 'work-list'

      await savePreference()

      expect(mockSetPreferences).toHaveBeenCalledWith({
        selectedListId: 'work-list',
        selectedListTitle: 'Work'
      })

      // Status message should appear
      const statusMsg = document.getElementById('status-message')
      expect(statusMsg?.classList.contains('hidden')).toBe(false)
      expect(statusMsg?.textContent).toMatch(/saved/i)
    })

    it('should show error when save fails', async () => {
      mockGetToken.mockResolvedValue('mock-token')
      mockGetPreferences.mockResolvedValue({ selectedListId: '@default', selectedListTitle: 'My Tasks' })
      mockGetTaskLists.mockResolvedValue([
        { id: '@default', title: 'My Tasks' }
      ])
      mockSetPreferences.mockRejectedValue(new Error('Storage quota exceeded'))

      const { loadData, savePreference, initElements } = await import('@/options/options')
      initElements()
      await loadData()

      await savePreference()

      const statusMsg = document.getElementById('status-message')
      expect(statusMsg?.textContent).toMatch(/failed to save/i)
    })
  })

  describe('handleSignIn', () => {
    it('should call getToken interactively and load data', async () => {
      mockGetToken.mockResolvedValue('fresh-token')
      mockGetPreferences.mockResolvedValue({ selectedListId: '@default', selectedListTitle: 'My Tasks' })
      mockGetTaskLists.mockResolvedValue([{ id: '@default', title: 'My Tasks' }])
      mockSetPreferences.mockResolvedValue(undefined)

      const { handleSignIn, initElements } = await import('@/options/options')
      initElements()
      await handleSignIn()

      expect(mockGetToken).toHaveBeenCalledWith(true)
      expect(mockGetTaskLists).toHaveBeenCalled()
    })

    it('should show error when sign-in fails', async () => {
      mockGetToken.mockRejectedValue(new Error('OAuth2 not granted'))

      const { handleSignIn, initElements } = await import('@/options/options')
      initElements()
      await handleSignIn()

      const statusMsg = document.getElementById('status-message')
      expect(statusMsg?.textContent).toMatch(/sign in failed/i)
    })
  })
})
