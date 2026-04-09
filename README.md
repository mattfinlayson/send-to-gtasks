# Send to Google Tasks

![CI](https://img.shields.io/github/actions/workflow/status/mattfinlayson/send-to-gtask/ci.yml?style=flat-square)

A Chrome extension that saves web pages as tasks in Google Tasks with a single click.

## Features

- **One-click task creation**: Click the extension icon to instantly save the current page
- **Keyboard shortcut**: Press `Ctrl+Shift+K` (or `Cmd+Shift+T` on Mac) for quick task creation
- **Quick save mode**: Enable in Options to create tasks directly without the popup
- **Page info capture**: Automatically uses page title and URL
- **Task list selection**: Choose which Google Tasks list to save to
- **Visual feedback**: Badge indicator shows success or error status

## Installation

### Prerequisites

1. Node.js 20+
2. npm 10+
3. A Google Cloud project with the Tasks API enabled
4. OAuth 2.0 credentials configured for Chrome extension

### Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the Google Tasks API
4. Go to **APIs & Services > Credentials**
5. Create OAuth 2.0 credentials:
   - Application type: Chrome extension
   - Extension ID: Your extension's ID (see below)
6. Copy the Client ID

### Build the Extension

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build for production
npm run build
```

### Load in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `dist` folder
5. Note the extension ID shown on the extension card

### Configure OAuth

1. Update `src/manifest.json` with your OAuth Client ID:
   ```json
   "oauth2": {
     "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
     ...
   }
   ```
2. In Google Cloud Console, update the OAuth credentials with your extension ID
3. Rebuild: `npm run build`
4. Reload the extension in Chrome

## Usage

1. Navigate to any web page
2. Click the extension icon
3. The first time, you'll be prompted to sign in with Google
4. The page will be saved as a task

### Configure Task List

1. Right-click the extension icon > "Options"
2. Select your preferred task list
3. Click "Save"


### Keyboard Shortcut

1. Press `Ctrl+Shift+K` (Windows/Linux) or `Cmd+Shift+T` (Mac) to save the current page
2. By default, this opens the popup with the page title and URL pre-filled
3. Enable **Quick save mode** in Options to create tasks directly with a toast notification

### Customize Keyboard Shortcut

1. Go to `chrome://extensions/shortcuts`
2. Find "Send to Google Tasks"
3. Click the shortcut field and enter your preferred key combination

## Permissions

This extension requires:

- **activeTab**: To access the current page's URL and title
- **storage**: To save your task list preference
- **identity**: To authenticate with your Google account
- **alarms**: To clear the success/error badge on the extension icon a few seconds after task creation. No background scheduling occurs.

The extension only accesses Google Tasks data - it cannot read or modify any other Google services.

## GitHub Actions CI/CD

This project uses GitHub Actions for continuous integration and releases.

### CI Workflow

Runs automatically on every pull request to `main`:
- Biome linting
- TypeScript type checking
- Vitest tests with coverage

### Release Workflow

Runs automatically when a GitHub Release is published:
- Validates version matches between git tag and `src/manifest.json`
- Builds the production extension
- Creates and uploads `send-to-gtask.zip` as a release asset

### Creating a Release

1. Update version in `src/manifest.json`
2. Create git tag: `git tag v1.0.0 && git push origin v1.0.0`
3. Go to GitHub Releases and click "Draft a new release"
4. Select your tag and publish
5. The workflow will build and attach the ZIP automatically

## Development

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Build development version (with source maps)
npm run build

# Type check only
npm run type-check

# Run tests with coverage report
npm run test:ci

# Run the full quality gate (lint + format + type-check + tests)
npm run check
```

### Quality Gate

```bash
npm run check
```

Runs Biome lint and format check, TypeScript type-check (`tsc --noEmit`), and the full test suite with coverage enforcement (80% threshold). Must exit 0 before committing.

### Production Build and Chrome Web Store Submission

```bash
npm run zip
```

Builds the extension and packages `dist/` into `send-to-gtask.zip`. Upload that file to the [Chrome Web Store developer dashboard](https://chrome.google.com/webstore/devconsole). Prepared listing copy (description, privacy practices, asset checklist) is in `specs/003-webstore-publish/contracts/store-listing.md`.

### Development Workflow

- **Branch naming**: `NNN-short-description` (e.g., `003-webstore-publish`)
- **Commit style**: Use prefixes — `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`
- **Quality gate**: `npm run check` must pass before every commit

## Project Structure

```
src/
├── background/         # Service worker
├── popup/              # Popup UI
├── options/            # Settings page
├── services/           # Core business logic
│   ├── auth.ts         # Google OAuth
│   ├── storage.ts      # Chrome storage
│   ├── tasks-api.ts    # Google Tasks API
│   ├── page-capture.ts # Tab info extraction
│   └── task-creation.ts# Main orchestration
└── types/              # TypeScript types
tests/
├── unit/               # Unit tests
└── integration/        # Integration tests
```

## License

MIT
