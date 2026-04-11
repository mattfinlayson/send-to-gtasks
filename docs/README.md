# Send to Google Tasks

![CI](https://img.shields.io/github/actions/workflow/status/mattfinlayson/send-to-gtask/ci.yml?style=flat-square)

You found something worth doing. Don't lose it in a tab. Send to Google Tasks saves the current page – title and URL – directly to your task list with one click or a keyboard shortcut.

[**Add to Chrome →**](#)

## How it works

Click the icon (or press `Ctrl+Shift+K` on Windows/Linux) and the page title and URL save as a new task. Sign in with Google on first use. That's it.

Want to skip the popup entirely? Enable **Quick save mode** in Options – tasks save instantly with a notification.

## Features

- One-click or keyboard shortcut task creation
- Automatic title and URL capture
- Choose which task list to save to
- Quick save mode for zero-friction capture
- Badge indicator confirms success or error

## Options

Right-click the extension icon and select **Options** to:
- Set your default task list
- Toggle quick save mode

To change the keyboard shortcut, go to `chrome://extensions/shortcuts`.

## Permissions

- **activeTab** — reads the page title and URL
- **storage** — saves your task list preference
- **identity** — signs you in with Google
- **alarms** — clears the badge after a few seconds; no background scheduling

This extension only accesses Google Tasks.

---

## For developers

### Prerequisites

- Node.js 20+, npm 10+
- Google Cloud project with Tasks API enabled
- OAuth 2.0 credentials (Application type: Chrome extension)

### Setup

```bash
npm install
npm test
npm run build
```

Load unpacked from `dist/` at `chrome://extensions/` with Developer mode on. Note your extension ID, then update `src/manifest.json`:

```json
"oauth2": {
  "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
  ...
}
```

Add the extension ID to your Google Cloud OAuth credentials, rebuild, and reload.

### Scripts

```bash
npm test              # Run tests
npm test -- --watch   # Watch mode
npm run build         # Build with source maps
npm run type-check    # Type check only
npm run test:ci       # Tests + coverage report
npm run check         # Full quality gate
npm run zip           # Package for Web Store
```

`npm run check` enforces 80% test coverage and must pass before every commit.

### Releasing

Releases are version-gated. The release workflow only triggers when a GitHub Release is published — it validates the tag matches the manifest version, builds, and attaches the ZIP.

1. Update `"version"` in `src/manifest.json` and the footer in `src/options/options.html`
2. Commit and push: `git commit -m "chore: release vX.Y.Z" && git push`
3. Tag the commit: `git tag vX.Y.Z && git push origin vX.Y.Z`
4. Go to **GitHub → Releases → Draft a new release**, select the tag, add release notes, and publish
5. CI builds and attaches `send-to-gtask.zip` to the release automatically
6. Download the ZIP and upload it to the Chrome Web Store

### Conventions

- **Branches**: `NNN-short-description`
- **Commits**: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`

### Project structure

```
src/
├── background/          # Service worker
├── popup/               # Popup UI
├── options/             # Settings page
└── services/
    ├── auth.ts          # Google OAuth
    ├── storage.ts       # Chrome storage
    ├── tasks-api.ts     # Google Tasks API
    ├── page-capture.ts  # Tab info extraction
    └── task-creation.ts # Main orchestration
tests/
├── unit/
└── integration/
```

## License

MIT