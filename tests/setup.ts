import { vi } from 'vitest'
import type { ExtensionMessage } from '@/types'

// Chrome API mock setup for vitest
// Based on vitest-chrome patterns from research.md

// Mock chrome.storage.local
const mockStorage: Record<string, unknown> = {}

const chromeStorageLocal = {
  get: vi.fn((keys: string | string[] | null, callback?: (items: Record<string, unknown>) => void) => {
    const result: Record<string, unknown> = {}
    if (keys === null) {
      Object.assign(result, mockStorage)
    } else if (typeof keys === 'string') {
      if (keys in mockStorage) {
        result[keys] = mockStorage[keys]
      }
    } else if (Array.isArray(keys)) {
      keys.forEach(key => {
        if (key in mockStorage) {
          result[key] = mockStorage[key]
        }
      })
    }
    if (callback) {
      callback(result)
    }
    return Promise.resolve(result)
  }),
  set: vi.fn((items: Record<string, unknown>, callback?: () => void) => {
    Object.assign(mockStorage, items)
    if (callback) {
      callback()
    }
    return Promise.resolve()
  }),
  remove: vi.fn((keys: string | string[], callback?: () => void) => {
    const keysArray = typeof keys === 'string' ? [keys] : keys
    keysArray.forEach(key => {
      delete mockStorage[key]
    })
    if (callback) {
      callback()
    }
    return Promise.resolve()
  }),
  clear: vi.fn((callback?: () => void) => {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key])
    if (callback) {
      callback()
    }
    return Promise.resolve()
  })
}

// Mock chrome.storage.session (ephemeral session storage)
const mockSessionStorage: Record<string, unknown> = {}

const chromeStorageSession = {
  get: vi.fn((keys: string | string[] | null, callback?: (items: Record<string, unknown>) => void) => {
    const result: Record<string, unknown> = {}
    if (keys === null) {
      Object.assign(result, mockSessionStorage)
    } else if (typeof keys === 'string') {
      if (keys in mockSessionStorage) {
        result[keys] = mockSessionStorage[keys]
      }
    } else if (Array.isArray(keys)) {
      keys.forEach(key => {
        if (key in mockSessionStorage) {
          result[key] = mockSessionStorage[key]
        }
      })
    }
    if (callback) {
      callback(result)
    }
    return Promise.resolve(result)
  }),
  set: vi.fn((items: Record<string, unknown>, callback?: () => void) => {
    Object.assign(mockSessionStorage, items)
    if (callback) {
      callback()
    }
    return Promise.resolve()
  }),
  remove: vi.fn((keys: string | string[], callback?: () => void) => {
    const keysArray = typeof keys === 'string' ? [keys] : keys
    keysArray.forEach(key => {
      delete mockSessionStorage[key]
    })
    if (callback) {
      callback()
    }
    return Promise.resolve()
  }),
  clear: vi.fn((callback?: () => void) => {
    Object.keys(mockSessionStorage).forEach(key => delete mockSessionStorage[key])
    if (callback) {
      callback()
    }
    return Promise.resolve()
  })
}

// Mock chrome.identity
const chromeIdentity = {
  getAuthToken: vi.fn((
    details: { interactive: boolean },
    callback?: (result: chrome.identity.GetAuthTokenResult) => void
  ) => {
    // Default: return a mock token
    const result: chrome.identity.GetAuthTokenResult = { token: 'mock-auth-token-12345' }
    if (callback) {
      callback(result)
    }
    return Promise.resolve(result)
  }),
  removeCachedAuthToken: vi.fn((
    details: { token: string },
    callback?: () => void
  ) => {
    if (callback) {
      callback()
    }
    return Promise.resolve()
  }),
  launchWebAuthFlow: vi.fn((
    details: { url: string; interactive: boolean },
    callback?: (responseUrl?: string) => void
  ) => {
    // Default: return a URL with a mock token
    const mockToken = 'mock-access-token'
    const mockRedirectUrl = `https://test-extension-id.chromiumapp.org/callback#access_token=${mockToken}&token_type=Bearer`
    if (callback) {
      callback(mockRedirectUrl)
    }
    return Promise.resolve(mockRedirectUrl)
  }),
  getRedirectURL: vi.fn((path?: string) => {
    return `https://test-extension-id.chromiumapp.org/${path || ''}`
  })
}

// Mock chrome.tabs
const chromeTabs = {
  query: vi.fn((
    queryInfo: { active?: boolean; currentWindow?: boolean },
    callback?: (tabs: chrome.tabs.Tab[]) => void
  ) => {
    const mockTab: chrome.tabs.Tab = {
      id: 1,
      index: 0,
      pinned: false,
      highlighted: true,
      windowId: 1,
      active: true,
      incognito: false,
      selected: true,
      discarded: false,
      autoDiscardable: true,
      groupId: -1,
      frozen: false,
      url: 'https://example.com/test-page',
      title: 'Test Page Title'
    }
    const tabs = [mockTab]
    if (callback) {
      callback(tabs)
    }
    return Promise.resolve(tabs)
  })
}

// Mock chrome.action
const chromeAction = {
  setIcon: vi.fn((details: { path: string; tabId?: number }, callback?: () => void) => {
    if (callback) callback()
    return Promise.resolve()
  }),
  setBadgeText: vi.fn((details: { text: string; tabId?: number }, callback?: () => void) => {
    if (callback) callback()
    return Promise.resolve()
  }),
  setBadgeBackgroundColor: vi.fn((details: { color: string }, callback?: () => void) => {
    if (callback) callback()
    return Promise.resolve()
  })
}

// Mock chrome.alarms
const chromeAlarms = {
  create: vi.fn(),
  clear: vi.fn(),
  onAlarm: {
    addListener: vi.fn(),
    removeListener: vi.fn()
  }
}

// Mock chrome.commands
const chromeCommands = {
  onCommand: {
    addListener: vi.fn(),
    removeListener: vi.fn()
  }
}

// Mock chrome.runtime — with onMessage listener capture for triggerMessage()
let registeredOnMessageListener: ((msg: ExtensionMessage, sender: chrome.runtime.MessageSender, sendResponse: (r: unknown) => void) => boolean | void) | null = null

const chromeRuntime = {
  lastError: undefined as { message?: string } | undefined,
  id: 'test-extension-id',
  sendMessage: vi.fn().mockResolvedValue({ success: true }),
  onMessage: {
    addListener: vi.fn((
      listener: (msg: ExtensionMessage, sender: chrome.runtime.MessageSender, sendResponse: (r: unknown) => void) => boolean | void
    ) => {
      registeredOnMessageListener = listener
    }),
    removeListener: vi.fn()
  },
  onInstalled: {
    addListener: vi.fn()
  }
}

// Assemble the chrome mock object
const chromeMock = {
  storage: {
    local: chromeStorageLocal,
    session: chromeStorageSession
  },
  identity: chromeIdentity,
  tabs: chromeTabs,
  action: chromeAction,
  alarms: chromeAlarms,
  commands: chromeCommands,
  runtime: chromeRuntime
}

// Assign to global
Object.assign(global, { chrome: chromeMock })

// Default token for mock
export const DEFAULT_MOCK_TOKEN = 'mock-auth-token-12345'

/**
 * Factory for creating mock tabs with sensible defaults.
 * Override any field via the overrides parameter.
 */
export function createMockTab(overrides?: Partial<chrome.tabs.Tab>): chrome.tabs.Tab {
  return {
    id: 1,
    index: 0,
    pinned: false,
    highlighted: false,
    windowId: 1,
    active: true,
    incognito: false,
    selected: false,
    discarded: false,
    autoDiscardable: true,
    groupId: -1,
    frozen: false,
    url: 'https://example.com',
    title: 'Example Page',
    ...overrides
  }
}

/**
 * Helper to trigger a registered onMessage listener (for testing service worker)
 */
export function triggerMessage(
  msg: ExtensionMessage,
  sender: Partial<chrome.runtime.MessageSender> = { id: 'test-extension-id' }
): void {
  if (registeredOnMessageListener) {
    registeredOnMessageListener(msg, sender as chrome.runtime.MessageSender, () => {})
  }
}

// Helper to reset all mocks between tests
export function resetChromeMocks(): void {
  Object.keys(mockStorage).forEach(key => delete mockStorage[key])
  Object.keys(mockSessionStorage).forEach(key => delete mockSessionStorage[key])
  vi.clearAllMocks()
  chromeRuntime.lastError = undefined
  registeredOnMessageListener = null

  // Restore default implementations
  chromeIdentity.getAuthToken.mockImplementation((
    details: { interactive: boolean },
    callback?: (result: chrome.identity.GetAuthTokenResult) => void
  ) => {
    const result: chrome.identity.GetAuthTokenResult = { token: DEFAULT_MOCK_TOKEN }
    if (callback) {
      callback(result)
    }
    return Promise.resolve(result)
  })

  chromeIdentity.launchWebAuthFlow.mockImplementation((
    details: { url: string; interactive: boolean },
    callback?: (responseUrl?: string) => void
  ) => {
    // Use same token as getAuthToken for consistency
    const mockRedirectUrl = `https://test-extension-id.chromiumapp.org/callback#access_token=${DEFAULT_MOCK_TOKEN}&token_type=Bearer`
    if (callback) {
      callback(mockRedirectUrl)
    }
    return Promise.resolve(mockRedirectUrl)
  })

  // Restore default chromeTabs.query implementation
  chromeTabs.query.mockImplementation((
    queryInfo: { active?: boolean; currentWindow?: boolean },
    callback?: (tabs: chrome.tabs.Tab[]) => void
  ) => {
    const mockTab: chrome.tabs.Tab = {
      id: 1,
      index: 0,
      pinned: false,
      highlighted: true,
      windowId: 1,
      active: true,
      incognito: false,
      selected: true,
      discarded: false,
      autoDiscardable: true,
      groupId: -1,
      frozen: false,
      url: 'https://example.com/test-page',
      title: 'Test Page Title'
    }
    const tabs = [mockTab]
    if (callback) {
      callback(tabs)
    }
    return Promise.resolve(tabs)
  })

  // Restore sendMessage to return a resolved Promise
  chromeRuntime.sendMessage.mockResolvedValue({ success: true })

  // Restore alarms.onAlarm.addListener to capture listeners
  chromeAlarms.onAlarm.addListener.mockImplementation(vi.fn())

  // Restore onMessage.addListener to capture listener
  chromeRuntime.onMessage.addListener.mockImplementation(
    (listener: (msg: ExtensionMessage, sender: chrome.runtime.MessageSender, sendResponse: (r: unknown) => void) => boolean | void) => {
      registeredOnMessageListener = listener
    }
  )
}

// Helper to set mock storage data
export function setMockStorage(data: Record<string, unknown>): void {
  Object.assign(mockStorage, data)
}

// Helper to get mock storage data
export function getMockStorage(): Record<string, unknown> {
  return { ...mockStorage }
}

// Helper to get mock session storage data
export function getMockSessionStorage(): Record<string, unknown> {
  return { ...mockSessionStorage }
}

// Helper to simulate auth error
export function simulateAuthError(message: string): void {
  chromeRuntime.lastError = { message }
}

// Helper to simulate no token
export function simulateNoToken(): void {
  chromeIdentity.getAuthToken.mockImplementation(((_details: unknown, callback?: (result: chrome.identity.GetAuthTokenResult) => void) => {
    if (callback) {
      callback({})
    }
    return Promise.resolve({} as chrome.identity.GetAuthTokenResult)
  }) as typeof chromeIdentity.getAuthToken)
}

// Export mocks for direct manipulation in tests
export {
  chromeMock,
  chromeStorageLocal,
  chromeStorageSession,
  chromeIdentity,
  chromeTabs,
  chromeAction,
  chromeAlarms,
  chromeRuntime,
  mockStorage,
  mockSessionStorage
}
