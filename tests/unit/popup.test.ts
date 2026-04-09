/**
 * Tests for popup.ts
 * TDD: Tests written before implementation
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { resetChromeMocks } from '../setup'
import { getErrorMessage, initElements, showAuth, createTask } from '@/popup/popup'

// Mock the task creation service
vi.mock('@/services/task-creation', () => ({
  createTaskFromCurrentPage: vi.fn()
}))

import { createTaskFromCurrentPage } from '@/services/task-creation'
const mockCreateTask = vi.mocked(createTaskFromCurrentPage)

describe('Popup - getErrorMessage', () => {
  beforeEach(() => {
    resetChromeMocks()
  })

  // T020: getErrorMessage('PERMISSION_DENIED') returns access-denied string
  it('should return access-denied string for PERMISSION_DENIED code', () => {
    const error = { code: 'PERMISSION_DENIED', message: 'Access denied.', retryable: false }
    const result = getErrorMessage(error)
    expect(result).toMatch(/access denied/i)
    expect(result).toMatch(/re-authorize/i)
  })

  it('should return sign-in message for AUTH_REQUIRED', () => {
    const error = { code: 'AUTH_REQUIRED', message: 'Auth required.', retryable: false }
    const result = getErrorMessage(error)
    expect(result).toMatch(/sign in/i)
  })

  it('should return rate-limited message for RATE_LIMITED', () => {
    const error = { code: 'RATE_LIMITED', message: 'Rate limited.', retryable: true }
    const result = getErrorMessage(error)
    expect(result).toMatch(/too many requests/i)
  })

  it('should return list-not-found message for LIST_NOT_FOUND', () => {
    const error = { code: 'LIST_NOT_FOUND', message: 'Not found.', retryable: false }
    const result = getErrorMessage(error)
    expect(result).toMatch(/task list was not found/i)
  })

  it('should return network error message for NETWORK_ERROR', () => {
    const error = { code: 'NETWORK_ERROR', message: 'Network.', retryable: true }
    const result = getErrorMessage(error)
    expect(result).toMatch(/unable to connect/i)
  })

  it('should return generic message for API_ERROR', () => {
    const error = { code: 'API_ERROR', message: 'API error.', retryable: true }
    const result = getErrorMessage(error)
    expect(result).toMatch(/something went wrong/i)
  })

  it('should return error.message for unknown codes', () => {
    const error = { code: 'UNKNOWN', message: 'Custom error message', retryable: false }
    const result = getErrorMessage(error)
    expect(result).toBe('Custom error message')
  })

  it('should return fallback for Error instances', () => {
    const error = new Error('No active tab found')
    const result = getErrorMessage(error)
    expect(result).toMatch(/could not access/i)
  })

  it('should return fallback for non-error values', () => {
    const result = getErrorMessage(null)
    expect(result).toBe('An unexpected error occurred.')
  })
})

// T045-T047: Popup DOM state tests
describe('Popup - DOM state management', () => {
  function setupDOM(): void {
    document.body.innerHTML = `
      <div id="status" class="status">
        <div id="status-icon" class="status-icon" aria-hidden="true"></div>
        <div id="status-message" class="status-message">Creating task...</div>
      </div>
      <div id="error-container" class="error-container hidden">
        <div id="error-message" class="error-message"></div>
        <button id="retry-button" class="retry-button" aria-label="Retry creating task">Retry</button>
      </div>
      <div id="auth-container" class="auth-container hidden">
        <p class="auth-message">Sign in to create tasks.</p>
        <button id="sign-in-button" class="sign-in-button" aria-label="Sign in with Google">Sign In with Google</button>
      </div>
      <div id="success-container" class="success-container hidden">
        <div class="success-icon" aria-hidden="true">&#10003;</div>
        <div id="success-message" class="success-message">Task created!</div>
      </div>
    `
  }

  beforeEach(() => {
    resetChromeMocks()
    setupDOM()
    mockCreateTask.mockReset()
  })

  // T045: showAuth() state shows #auth-container and hides status/error/success containers
  it('T045: showAuth shows auth-container and hides other containers', () => {
    initElements()
    showAuth()

    expect(document.getElementById('auth-container')?.classList.contains('hidden')).toBe(false)
    expect(document.getElementById('status')?.classList.contains('hidden')).toBe(true)
    expect(document.getElementById('error-container')?.classList.contains('hidden')).toBe(true)
    expect(document.getElementById('success-container')?.classList.contains('hidden')).toBe(true)
  })

  // T046: createTask() calls showAuth() when error has code === 'AUTH_REQUIRED'
  it('T046: createTask calls showAuth on AUTH_REQUIRED error', async () => {
    initElements()
    mockCreateTask.mockRejectedValueOnce({
      code: 'AUTH_REQUIRED',
      message: 'Auth required',
      retryable: false
    })

    await createTask()

    const authContainer = document.getElementById('auth-container')
    expect(authContainer?.classList.contains('hidden')).toBe(false)
    // Status should be hidden
    expect(document.getElementById('status')?.classList.contains('hidden')).toBe(true)
    // Error container should be hidden (not showing error, showing auth instead)
    expect(document.getElementById('error-container')?.classList.contains('hidden')).toBe(true)
  })

  // T047: sign-in button click triggers createTask() flow
  it('T047: sign-in button click triggers task creation', async () => {
    mockCreateTask.mockResolvedValueOnce({
      kind: 'tasks#task', id: 'task-1', etag: 'e', title: 'T',
      updated: '', selfLink: '', position: '', status: 'needsAction'
    })
    initElements()

    // Wire up the sign-in button as popup.ts init() does
    const signInButton = document.getElementById('sign-in-button')
    signInButton?.addEventListener('click', () => { void createTask() })

    signInButton?.click()
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(mockCreateTask).toHaveBeenCalledTimes(1)
  })
})
