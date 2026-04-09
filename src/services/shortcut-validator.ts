/**
 * Shortcut Validation Service
 * Validates keyboard shortcut format and detects conflicts with Chrome built-ins
 */

/**
 * Chrome built-in shortcuts that cannot be used by extensions
 * Based on Chrome's reserved shortcuts documentation
 */
export const CHROME_RESERVED_SHORTCUTS = [
  // Chrome browser shortcuts (Ctrl/Cmd based)
  'Ctrl+T',
  'Command+T', // New tab
  'Ctrl+W',
  'Command+W', // Close tab
  'Ctrl+Shift+T',
  'Command+Shift+T', // Reopen closed tab (our default!)
  'Ctrl+N',
  'Command+N', // New window
  'Ctrl+Shift+N',
  'Command+Shift+N', // New incognito window
  'Ctrl+H',
  'Command+H', // History
  'Ctrl+J',
  'Command+J', // Downloads
  'Ctrl+D',
  'Command+D', // Bookmark this page
  'Ctrl+Shift+D',
  'Command+Shift+D', // Bookmark all tabs
  'Ctrl+Shift+M',
  'Command+Shift+M', // Open as email
  'Ctrl+L',
  'Command+L', // Focus address bar
  'Ctrl+K',
  'Command+K', // Focus search
  'Ctrl+Shift+B',
  'Command+Shift+B', // Toggle bookmarks bar
  'Ctrl+Shift+A',
  'Command+Shift+A', // Manage extensions
  'Ctrl+Shift+C',
  'Command+Shift+C', // Developer tools (inspect)
  'Ctrl+Shift+J',
  'Command+Shift+J', // JS console
  'Ctrl+Shift+I',
  'Command+Option+I', // DevTools
  'F12', // DevTools
  'Ctrl+F',
  'Command+F', // Find
  'Ctrl+G',
  'Command+G', // Find next
  'Ctrl+Shift+G',
  'Command+Shift+G', // Find previous
  'Ctrl+Tab',
  'Ctrl+Shift+Tab', // Switch tabs
  'Alt+F4',
  'Command+Q', // Quit
  'Alt+Tab', // Switch windows
  // Zoom
  'Ctrl+Plus',
  'Ctrl+Minus',
  'Ctrl+0',
  'Command+Plus',
  'Command+Minus',
  'Command+0',
  // Other browser functions
  'Ctrl+S',
  'Command+S', // Save page
  'Ctrl+P',
  'Command+P', // Print
  'Ctrl+R',
  'Command+R', // Reload
  'Ctrl+Shift+R',
  'Command+Shift+R', // Hard reload
  'Escape', // Stop loading
  'Ctrl+U',
  'Command+Option+U', // View source
]

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validate a keyboard shortcut
 * @param shortcut - The shortcut string to validate (e.g., "Ctrl+Shift+T")
 * @returns Validation result with error message if invalid
 */
export function validateShortcut(shortcut: string): ValidationResult {
  // Check for empty
  if (!shortcut?.trim()) {
    return { valid: false, error: 'Shortcut cannot be empty' }
  }

  // Check for valid format (should contain modifier + key)
  const trimmed = shortcut.trim()

  // Normalize shortcut format
  const normalized = normalizeShortcut(trimmed)

  // Check if it conflicts with Chrome built-ins
  if (isChromeReservedShortcut(normalized)) {
    return {
      valid: false,
      error: `This shortcut conflicts with Chrome. Choose another (${getChromeShortcutDescription(normalized)}).`,
    }
  }

  // Check format validity
  if (!isValidFormat(normalized)) {
    return {
      valid: false,
      error: 'Invalid shortcut format. Use format like "Ctrl+Shift+T"',
    }
  }

  return { valid: true }
}

/**
 * Normalize shortcut to standard format
 * Handles case-insensitivity and different modifier syntax
 */
function normalizeShortcut(shortcut: string): string {
  // Replace common variations
  return (
    shortcut
      .replace(/\s+/g, '') // Remove spaces
      .replace(/control/gi, 'Ctrl')
      .replace(/cmd/gi, 'Command')
      .replace(/command/gi, 'Command')
      .replace(/meta/gi, 'Command')
      .replace(/option/gi, 'Alt')
      .replace(/alt/gi, 'Alt')
      .replace(/shift/gi, 'Shift')
      // Keep as-is but lowercase for matching
      .toLowerCase()
  )
}

/**
 * Check if shortcut matches a Chrome reserved shortcut
 */
function isChromeReservedShortcut(shortcut: string): boolean {
  const normalized = normalizeShortcut(shortcut)
  return CHROME_RESERVED_SHORTCUTS.some((reserved) => {
    const normalizedReserved = normalizeShortcut(reserved)
    return normalized === normalizedReserved
  })
}

/**
 * Get a human-readable description of a Chrome reserved shortcut
 */
function getChromeShortcutDescription(shortcut: string): string {
  const descriptions: Record<string, string> = {
    'Ctrl+T': 'Ctrl+T (New tab)',
    'Ctrl+W': 'Ctrl+W (Close tab)',
    'Ctrl+Shift+T': 'Ctrl+Shift+T (Reopen closed tab)',
    'Ctrl+N': 'Ctrl+N (New window)',
    'Ctrl+Shift+N': 'Ctrl+Shift+N (New incognito window)',
    'Ctrl+H': 'Ctrl+H (History)',
    'Ctrl+J': 'Ctrl+J (Downloads)',
    'Ctrl+L': 'Ctrl+L (Focus address bar)',
    'Ctrl+F': 'Ctrl+F (Find)',
    'Ctrl+S': 'Ctrl+S (Save page)',
    'Ctrl+P': 'Ctrl+P (Print)',
  }

  const normalized = normalizeShortcut(shortcut)
  return descriptions[normalized] || shortcut
}

/**
 * Check if shortcut has a valid format
 * Valid: "Ctrl+Shift+T", "Alt+F4", "F12", etc.
 */
function isValidFormat(shortcut: string): boolean {
  // Must have at least one modifier and one key, or be a function key
  // Use case-insensitive matching since we lowercase during normalization
  // Allow multiple modifiers like Ctrl+Shift+T, Command+Shift+K
  const modifierKeyPattern =
    /^(ctrl|alt|shift|command|macctrl)(\+(ctrl|alt|shift|command|macctrl))*\+[a-z0-9]$/i
  const functionKeyPattern = /^f[0-9]{1,2}$/i
  const specialKeyPattern =
    /^(escape|enter|tab|backspace|delete|home|end|pageup|pagedown|arrowleft|arrowright|arrowup|arrowdown|insert|printscreen)$/i

  return (
    modifierKeyPattern.test(shortcut) ||
    functionKeyPattern.test(shortcut) ||
    specialKeyPattern.test(shortcut)
  )
}
