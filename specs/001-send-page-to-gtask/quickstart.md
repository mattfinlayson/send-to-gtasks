# Quickstart: Send Page to Google Tasks

**Date**: 2025-11-25
**Branch**: `001-send-page-to-gtask`

## Prerequisites

- Node.js 18+ installed
- Chrome, Edge, or Brave browser (Manifest V3 support)
- Google Cloud Console account (for OAuth client ID)

## 1. Project Setup

```bash
# Clone and enter project
cd send-to-gtask

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

## 2. Google Cloud Setup

### Create OAuth Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable the **Google Tasks API**:
   - APIs & Services → Library → Search "Tasks API" → Enable
4. Configure OAuth consent screen:
   - APIs & Services → OAuth consent screen
   - User Type: External
   - App name: "Send to Google Tasks"
   - Scopes: Add `https://www.googleapis.com/auth/tasks`
5. Create OAuth credentials:
   - APIs & Services → Credentials → Create Credentials → OAuth client ID
   - Application type: **Chrome Extension**
   - Name: "send-to-gtask"
   - Copy the Client ID

### Configure Extension

Edit `src/manifest.json`:
```json
{
  "oauth2": {
    "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
    "scopes": ["https://www.googleapis.com/auth/tasks"]
  }
}
```

## 3. Development

### Build Extension

```bash
# Development build (with source maps)
npm run dev

# Production build
npm run build
```

Output is in `dist/` directory.

### Load in Browser

1. Open `chrome://extensions/` (or `edge://extensions/`)
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `dist/` folder

### Development Workflow

```bash
# Watch mode - rebuilds on changes
npm run dev

# After code changes:
# 1. Save file (auto-rebuilds)
# 2. Go to chrome://extensions/
# 3. Click refresh icon on the extension
# 4. Test changes
```

## 4. Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

### Test Structure

```
tests/
├── unit/           # Unit tests (mocked Chrome APIs)
├── integration/    # Integration tests
└── setup.ts        # Chrome API mock setup
```

## 5. Using the Extension

### First-Time Setup

1. Click the extension icon in the toolbar
2. Click "Sign in with Google"
3. Authorize access to Google Tasks
4. Done! You're ready to save pages

### Daily Usage

1. Navigate to any webpage
2. Click the extension icon
3. Task is created with page title and URL
4. See confirmation message

### Changing Task List (optional)

1. Right-click extension icon → "Options"
2. Select your preferred task list
3. Future tasks will be saved to that list

## 6. Project Structure

```
send-to-gtask/
├── src/
│   ├── background/
│   │   └── service-worker.ts    # Background tasks
│   ├── popup/
│   │   ├── popup.html           # Popup UI
│   │   ├── popup.ts             # Popup logic
│   │   └── popup.css            # Styles
│   ├── services/
│   │   ├── auth.ts              # OAuth handling
│   │   ├── tasks-api.ts         # Google Tasks API
│   │   └── storage.ts           # Local storage
│   ├── types/
│   │   └── index.ts             # TypeScript types
│   └── manifest.json            # Extension manifest
├── tests/
│   └── ...
├── dist/                        # Build output
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

## 7. Common Issues

### "This extension doesn't have permission"

- Ensure `activeTab` permission is in manifest
- Extension only works on standard web pages (not chrome://, file://)

### "Sign-in failed"

- Check Client ID matches Google Cloud project
- Verify Tasks API is enabled
- Ensure OAuth consent screen is configured

### "Task list not found"

- The selected list may have been deleted
- Go to Options and select a new list

### Tests failing

```bash
# Clear test cache
npm run test -- --clearCache

# Verify Chrome mock setup
cat tests/setup.ts
```

## 8. Commands Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Development build with watch |
| `npm run build` | Production build |
| `npm test` | Run tests |
| `npm run test:watch` | Tests in watch mode |
| `npm run test:coverage` | Tests with coverage report |
| `npm run lint` | Check code style |
| `npm run lint:fix` | Fix code style issues |

## Next Steps

- Read [spec.md](./spec.md) for feature requirements
- Read [data-model.md](./data-model.md) for data structures
- Read [contracts/](./contracts/) for API details
- Run `/speckit.tasks` to generate implementation tasks
