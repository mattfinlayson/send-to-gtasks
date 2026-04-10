/**
 * Tests for options.ts
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { resetChromeMocks, chromeIdentity, setMockStorage } from '../setup'

// Mock the services
vi.mock('@/services/auth', () => ({
  getToken: vi.fn(),
  removeToken: vi.fn(),
  logout: vi.fn()
}))

vi.mock('@/services/tasks-api', () => ({
  getTaskLists: vi.fn()
}))

vi.mock('@/services/storage', () => ({
  getPreferences: vi.fn(),
  setPreferences: vi.fn(),
  getQuickSaveEnabled: vi.fn(),
  setQuickSaveEnabled: vi.fn()
}))

import { getToken, logout } from '@/services/auth'
import { getTaskLists } from '@/services/tasks-api'
import { getPreferences, setPreferences, getQuickSaveEnabled, setQuickSaveEnabled } from '@/services/storage'

const mockGetToken = vi.mocked(getToken)
const mockLogout = vi.mocked(logout)
const mockGetTaskLists = vi.mocked(getTaskLists)
const mockGetPreferences = vi.mocked(getPreferences)
const mockSetPreferences = vi.mocked(setPreferences)
const mockGetQuickSaveEnabled = vi.mocked(getQuickSaveEnabled)
const mockSetQuickSaveEnabled = vi.mocked(setQuickSaveEnabled)
const mockGetProfileUserInfo = vi.mocked(chromeIdentity.getProfileUserInfo)

function setupDOM(): void {
  document.body.innerHTML = `
    <div id="options-container">
      <header class="header">
        <div class="header-brand">
          <img src="icons/icon-48.png" alt="" class="header-icon" width="48" height="48">
          <div class="header-text">
            <h1 class="header-title">Send to Google Tasks</h1>
            <span class="header-subtitle">Settings</span>
          </div>
        </div>
      </header>

      <div id="loading" class="loading">
        <div class="spinner" aria-hidden="true"></div>
        <span>Loading...</span>
      </div>

      <div id="content" class="content hidden">
        <div class="section-label">Account</div>
        <div class="card" id="account-card">
          <div class="account-info">
            <div class="account-email-wrapper">
              <svg class="account-icon" viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              <span id="account-email" class="account-email">Loading...</span>
            </div>
            <button id="logout-button" class="sign-out-button" aria-label="Sign out">Sign Out</button>
          </div>
        </div>

        <div class="section-label">Task List</div>
        <div class="card">
          <label for="list-select" class="field-label">Default list</label>
          <div class="list-selector">
            <select id="list-select" class="select" aria-label="Select default task list">
              <option value="@default">My Tasks</option>
            </select>
            <button id="refresh-button" class="refresh-button" aria-label="Refresh task lists" title="Refresh task lists">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
              </svg>
            </button>
          </div>
          <div id="status-message" class="status-message hidden" role="status" aria-live="polite"></div>
        </div>

        <div class="section-label">Keyboard Shortcut</div>
        <div class="card">
          <div class="shortcut-display">
            <div class="shortcut-keys">
              <kbd id="modifier-key-1">⌘</kbd>
              <kbd id="modifier-key-2">Shift</kbd>
              <kbd id="main-key">K</kbd>
            </div>
            <span class="shortcut-label">Save current page as task</span>
          </div>

          <div class="toggle-row">
            <label class="toggle-wrapper">
              <input type="checkbox" id="quick-save-toggle" class="toggle-input">
              <span class="toggle-track">
                <span class="toggle-thumb"></span>
              </span>
              <span class="toggle-text">
                <span class="toggle-title">Quick save mode</span>
                <span class="toggle-description">Skip popup, create task directly</span>
              </span>
            </label>
          </div>

          <a href="chrome://extensions/shortcuts" class="customize-link" target="_blank" rel="noopener">
            Customize in Chrome settings
          </a>
        </div>
      </div>

      <div id="error" class="error-state hidden">
        <svg class="error-icon" viewBox="0 0 24 24" width="48" height="48">
          <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
        <p id="error-message" class="error-message">Something went wrong</p>
        <button id="retry-button" class="button primary">Try Again</button>
      </div>

      <div id="auth-required" class="auth-state hidden">
        <div class="section-label">Account</div>
        <div class="card">
          <p class="auth-prompt">Sign in to save tasks to your Google account</p>
          <button id="sign-in-button" class="google-sign-in">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  `
}

describe('Options Page', () => {
  beforeEach(() => {
    resetChromeMocks()
    setupDOM()
    mockGetToken.mockReset()
    mockLogout.mockReset()
    mockGetTaskLists.mockReset()
    mockGetPreferences.mockReset()
    mockSetPreferences.mockReset()
    mockGetQuickSaveEnabled.mockReset()
    mockSetQuickSaveEnabled.mockReset()
    mockGetProfileUserInfo.mockReset()
    mockGetProfileUserInfo.mockResolvedValue({ id: '123', email: 'test@example.com' })
  })

  describe('loadData', () => {
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
      mockGetQuickSaveEnabled.mockResolvedValue(false)

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
      mockGetQuickSaveEnabled.mockResolvedValue(false)

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

    it('should display account email', async () => {
      mockGetToken.mockResolvedValue('mock-token')
      mockGetPreferences.mockResolvedValue({ selectedListId: '@default', selectedListTitle: 'My Tasks' })
      mockGetTaskLists.mockResolvedValue([{ id: '@default', title: 'My Tasks' }])
      mockGetQuickSaveEnabled.mockResolvedValue(false)
      mockGetProfileUserInfo.mockResolvedValue({ id: '123', email: 'user@gmail.com' })

      const { loadData, initElements } = await import('@/options/options')
      initElements()
      await loadData()

      const emailElement = document.getElementById('account-email')
      expect(emailElement?.textContent).toBe('user@gmail.com')
    })
  })

  describe('savePreference', () => {
    it('should save selected preference on dropdown change', async () => {
      mockGetToken.mockResolvedValue('mock-token')
      mockGetPreferences.mockResolvedValue({ selectedListId: '@default', selectedListTitle: 'My Tasks' })
      mockGetTaskLists.mockResolvedValue([
        { id: '@default', title: 'My Tasks' },
        { id: 'work-list', title: 'Work' }
      ])
      mockSetPreferences.mockResolvedValue(undefined)
      mockGetQuickSaveEnabled.mockResolvedValue(false)

      const { init } = await import('@/options/options')
      init()

      // Wait for loadData to complete
      await new Promise(resolve => setTimeout(resolve, 50))

      // Select the work list and trigger change
      const select = document.getElementById('list-select') as HTMLSelectElement
      select.value = 'work-list'
      select.dispatchEvent(new Event('change'))

      // Wait for async save
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(mockSetPreferences).toHaveBeenCalledWith({
        selectedListId: 'work-list',
        selectedListTitle: 'Work'
      })

      // Status message should appear
      const statusMsg = document.getElementById('status-message')
      expect(statusMsg?.classList.contains('hidden')).toBe(false)
      expect(statusMsg?.textContent).toBe('Saved')
    })

    it('should show error when save fails', async () => {
      mockGetToken.mockResolvedValue('mock-token')
      mockGetPreferences.mockResolvedValue({ selectedListId: '@default', selectedListTitle: 'My Tasks' })
      mockGetTaskLists.mockResolvedValue([
        { id: '@default', title: 'My Tasks' }
      ])
      mockSetPreferences.mockRejectedValue(new Error('Storage quota exceeded'))
      mockGetQuickSaveEnabled.mockResolvedValue(false)

      const { loadData, savePreference, initElements } = await import('@/options/options')
      initElements()
      await loadData()

      await savePreference()

      const statusMsg = document.getElementById('status-message')
      expect(statusMsg?.textContent).toBe('Failed to save')
    })
  })

  describe('handleSignIn', () => {
    it('should call getToken interactively and load data', async () => {
      mockGetToken.mockResolvedValue('fresh-token')
      mockGetPreferences.mockResolvedValue({ selectedListId: '@default', selectedListTitle: 'My Tasks' })
      mockGetTaskLists.mockResolvedValue([{ id: '@default', title: 'My Tasks' }])
      mockSetPreferences.mockResolvedValue(undefined)
      mockGetQuickSaveEnabled.mockResolvedValue(false)

      const { handleSignIn, initElements } = await import('@/options/options')
      initElements()
      await handleSignIn()

      expect(mockGetToken).toHaveBeenCalledWith(true)
      expect(mockGetTaskLists).toHaveBeenCalled()
    })

    it('should show error in auth prompt when sign-in fails', async () => {
      mockGetToken.mockRejectedValue(new Error('OAuth2 not granted'))

      const { handleSignIn, initElements } = await import('@/options/options')
      initElements()
      await handleSignIn()

      const authPrompt = document.querySelector('.auth-prompt')
      expect(authPrompt?.textContent).toMatch(/sign in failed/i)
    })
  })

  describe('handleSignOut', () => {
    it('should call logout and show auth state', async () => {
      mockLogout.mockResolvedValue(undefined)

      const { handleSignOut, initElements } = await import('@/options/options')
      initElements()
      await handleSignOut()

      expect(mockLogout).toHaveBeenCalled()

      // Auth required section should be visible
      const authRequired = document.getElementById('auth-required')
      expect(authRequired?.classList.contains('hidden')).toBe(false)
    })

    it('should show auth state even if logout fails', async () => {
      mockLogout.mockRejectedValue(new Error('Logout failed'))

      const { handleSignOut, initElements } = await import('@/options/options')
      initElements()
      await handleSignOut()

      // Auth required section should be visible
      const authRequired = document.getElementById('auth-required')
      expect(authRequired?.classList.contains('hidden')).toBe(false)
    })
  })

  describe('handleQuickSaveToggle', () => {
    it('should save preference when toggled', async () => {
      mockGetToken.mockResolvedValue('mock-token')
      mockGetPreferences.mockResolvedValue({ selectedListId: '@default', selectedListTitle: 'My Tasks' })
      mockGetTaskLists.mockResolvedValue([{ id: '@default', title: 'My Tasks' }])
      mockGetQuickSaveEnabled.mockResolvedValue(false)
      mockSetQuickSaveEnabled.mockResolvedValue(undefined)

      const { init } = await import('@/options/options')
      init()

      // Wait for loadData to complete
      await new Promise(resolve => setTimeout(resolve, 50))

      // Toggle the quick save switch
      const toggle = document.getElementById('quick-save-toggle') as HTMLInputElement
      toggle.checked = true
      toggle.dispatchEvent(new Event('change'))

      await new Promise(resolve => setTimeout(resolve, 50))

      expect(mockSetQuickSaveEnabled).toHaveBeenCalledWith(true)
    })
  })
})
