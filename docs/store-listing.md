# Contract: Chrome Web Store Listing Copy

**Feature**: 003-webstore-publish
**Date**: 2026-04-08
**Status**: Ready for upload

This document contains all text and metadata required for the Chrome Web Store developer dashboard submission. Copy each field verbatim.

---

## Required Fields

### Extension Name
```
Send to Google Tasks
```

### Short Description (≤132 characters)
```
Save any web page as a Google Task with one click. Captures the title and URL automatically.
```
Character count: 91 ✓

### Category
```
Productivity
```

### Language
```
English (United States)
```

---

## Detailed Description (Chrome Web Store format — plain text, no markdown)

```
Send to Google Tasks lets you save any web page as a task in Google Tasks with a single click — no copying, no switching apps.

HOW IT WORKS

Click the extension icon while viewing any page. The extension captures the page title and URL and creates a new task in your Google Tasks list. A brief badge confirms success. That's it.

On first use, you'll be asked to sign in with Google. Your account is used only to create tasks — the extension cannot read your email, calendar, or any other Google service.

KEY FEATURES

• One-click task creation from any page
• Page title becomes the task name; URL is saved in the task notes
• Choose which task list to save to (configurable in Options)
• Works on any http or https page
• Visual badge confirms success or flags an error
• Secure OAuth2 authentication via Google — no passwords stored

HOW TO USE

1. Click the extension icon on any page
2. Sign in with Google when prompted (first use only)
3. Your task is created instantly
4. To change the default task list: right-click the icon → Options → select a list → Save

PERMISSIONS EXPLAINED

This extension requests the following permissions:

• activeTab — to read the current page's title and URL when you click the icon. No background page monitoring.
• storage — to remember your selected task list preference between sessions.
• identity — to authenticate with your Google account via OAuth2. Your token is managed securely by Chrome.
• alarms — to clear the success/error badge on the extension icon after a short delay. No background scheduling.

The extension does not collect analytics, does not track your browsing, and does not transmit any data except the page title and URL of pages you explicitly choose to save.

OPEN SOURCE

Send to Google Tasks is open source. Source code and contribution guidelines are available on GitHub.

SUPPORT

For bug reports and feature requests, please open an issue on the GitHub repository.
```

---

## Store Assets Checklist

| Asset | Size | Status |
|---|---|---|
| Extension icon (store tile) | 128×128 PNG | ✓ `src/icons/icon-128.png` |
| Extension icon (small) | 48×48 PNG | ✓ `src/icons/icon-48.png` |
| Screenshot 1 | 1280×800 or 640×400 | ⬜ Not required for initial submission |
| Promotional image (small) | 440×280 PNG | ⬜ Optional — skip for initial submission |

---

## Privacy Practices (required since 2023)

When prompted for privacy practices in the developer dashboard:

**Does your extension collect or use any user data?**
→ Yes

**Data types used:**
- Website content (page title and URL): Collected when user explicitly clicks the icon. Used to create a Google Task. Not stored on any server — sent directly to Google Tasks API.
- Authentication info (OAuth token): Managed by Chrome's identity API. Never stored by the extension.

**Single purpose description:**
```
Save the current web page as a Google Task.
```

---

## Developer Dashboard Submission Checklist

Before submitting:
- [ ] `manifest.json` version is `1.0.0`
- [ ] Production build created: `npm run zip`
- [ ] `send-to-gtask.zip` file size is under 10MB
- [ ] All four icon sizes present in the ZIP under `icons/`
- [ ] Popup and options page load without errors in Chrome
- [ ] OAuth consent screen is configured in Google Cloud Console
- [ ] Extension ID is registered in Google Cloud OAuth credentials
- [ ] Privacy practices form completed in developer dashboard
- [ ] Short description is ≤132 characters
- [ ] Category set to Productivity
