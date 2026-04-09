# Research: Keyboard Shortcut Feature

## Chrome Command API (Keyboard Shortcuts)

### Decision
Use Chrome's native Command API for keyboard shortcut registration and handling.

### Rationale
- Chrome's Command API is the **recommended approach** for Manifest V3 extensions
- Provides built-in conflict detection with Chrome and other extensions
- Handles permission management automatically
- Shortcuts persist across browser restarts natively
- User can customize via `chrome://extensions/shortcuts`

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| Custom keydown listener | Would require `activeTab` permission and manual conflict handling |
| content script keyboard listener | Limited to page context, conflicts with page shortcuts |
| Vite plugin for shortcuts | Not applicable to Chrome Extension architecture |

### Key Findings

1. **Command registration** happens in `manifest.json` under `commands` key
2. **Default shortcuts** are defined in manifest, user customization via chrome://extensions/shortcuts
3. **Handler** is `chrome.commands.onCommand` event listener in background script
4. **Conflict detection** is automatic via Chrome's Shortcuts page

### Best Practices

1. Use descriptive names for commands (not just "action")
2. Define shortcuts as "Ctrl+Shift+[Key]" for cross-platform compatibility
3. Provide clear descriptions for what each shortcut does
4. Handle `onCommand` event in service worker (background script)
5. Use `chrome.storage.session` for quick-save preference (ephemeral, per-session)

### Toast Notification Approach

For quick-save feedback without popup:
- Chrome Extension toast requires either:
  - A popup that auto-closes
  - An offscreen document
  - Chrome notifications API (may be intrusive)

**Decision**: Use a minimal popup that auto-closes after 2 seconds for toast-like behavior.

---

## Summary

- Use **Chrome Command API** for shortcut registration and handling
- Default: `Ctrl+Shift+K` (as specified)
- Shortcut persists via Chrome's native mechanism
- Quick-save toast: minimal auto-closing popup
