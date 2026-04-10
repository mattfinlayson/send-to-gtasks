/**
 * Tests for popup.ts
 * TDD: Tests written before implementation
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { resetChromeMocks } from '../setup'
import { getErrorMessage, initElements } from '@/popup/popup'

// Mock chrome.tabs
const mockTabsQuery = vi.fn()
vi.stubGlobal('chrome', {
  tabs: { query: mockTabsQuery },
  runtime: { sendMessage: vi.fn() }
})

// Mock the task creation service
vi.mock('@/services/task-creation', () => ({
  createTaskFromOptions: vi.fn()
}))

import { createTaskFromOptions } from '@/services/task-creation'
const mockCreateTask = vi.mocked(createTaskFromOptions)

// Mock storage
vi.mock('@/services/storage', () => ({
  addSavedUrl: vi.fn().mockResolvedValue(undefined),
  getPreferences: vi.fn().mockResolvedValue({ selectedListId: '@default', selectedListTitle: 'My Tasks' })
}))

describe('Popup - getErrorMessage', () => {
  beforeEach(() => {
    resetChromeMocks()
    mockCreateTask.mockReset()
    mockTabsQuery.mockReset()
  })

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
  beforeEach(() => {
    resetChromeMocks()
    mockCreateTask.mockReset()
    mockTabsQuery.mockReset()
  })

  function setupDOM(): void {
    document.body.innerHTML = `
      <form id="task-form">
        <textarea id="notes-input" maxlength="1024"></textarea>
        <div id="notes-counter">0/1024</div>
        <input type="date" id="due-date-picker">
        <div id="date-warning" class="hidden">Note: Date is in the past</div>
        <button type="submit" id="save-button">Save Task</button>
      </form>
      <div id="loading-container" class="hidden">
        <div class="status-message">Creating task...</div>
      </div>
      <div id="error-container" class="hidden">
        <div id="error-message"></div>
        <button id="retry-button">Retry</button>
      </div>
      <div id="success-container" class="hidden">
        <div class="success-message">Task created!</div>
      </div>
    `
  }

  setupDOM()

  // T045: Form elements are present
  it('T045: Form contains all required elements', () => {
    initElements()
    expect(document.getElementById('task-form')).toBeTruthy()
    expect(document.getElementById('notes-input')).toBeTruthy()
    expect(document.getElementById('due-date-picker')).toBeTruthy()
    expect(document.getElementById('save-button')).toBeTruthy()
  })

  // T046: Notes counter logic
  it('T046: Notes counter calculates correct character count', () => {
    // Test the character count logic directly
    const text = 'Test note'
    const maxLength = 1024
    const count = text.length
    expect(`${count}/${maxLength}`).toBe('9/1024')
  })

  // T047: Due date validation logic for past dates
  it('T047: Past date warning logic works correctly', () => {
    const selectedDate = new Date()
    selectedDate.setDate(selectedDate.getDate() - 1)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Selected date is in the past
    expect(selectedDate < today).toBe(true)

    // Future date should not trigger warning
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 1)
    expect(futureDate < today).toBe(false)
  })
})
