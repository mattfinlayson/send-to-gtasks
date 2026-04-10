/**
 * Shortcut Preference Types
 * Based on data-model.md
 */

/**
 * User's keyboard shortcut configuration
 */
export interface ShortcutPreference {
  /** The key or key combination, e.g., "Ctrl+Shift+T" */
  shortcut_key: string
  /** Whether using the manifest default shortcut */
  is_default: boolean
  /** Whether to skip popup and create task directly */
  quick_save_enabled: boolean
  /** Unix timestamp of last modification */
  last_modified: number
}

/**
 * Default shortcut key
 */
export const DEFAULT_SHORTCUT_KEY = 'Ctrl+Shift+K'

/**
 * Default shortcut preference values
 */
export const DEFAULT_SHORTCUT_PREFERENCE: ShortcutPreference = {
  shortcut_key: DEFAULT_SHORTCUT_KEY,
  is_default: true,
  quick_save_enabled: false,
  last_modified: 0,
}
