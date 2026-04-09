# Quickstart: GitHub Actions CI/CD for Chrome Web Store Release

## Overview

This project uses GitHub Actions for continuous integration and automated releases.

## Workflows

### 1. CI Workflow (`ci.yml`)

Runs automatically on every pull request to `main`.

**What it does:**
- Installs dependencies
- Runs linting (`npm run lint`)
- Runs type checking (`npm run type-check`)
- Runs tests with coverage (`npm run test`)

**Status check:** All three jobs must pass before a PR can be merged.

### 2. Release Workflow (`release.yml`)

Runs automatically when a new GitHub Release is published.

**What it does:**
- Validates version matches between git tag and manifest.json
- Builds the extension (`npm run build`)
- Creates the distributable ZIP (`npm run zip`)
- Uploads the ZIP as a release asset

## Creating a Release

1. Update the version in `src/manifest.json`:
   ```json
   {
     "version": "1.0.0"
   }
   ```

2. Create and push a git tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

3. Create the GitHub release:
   - Go to the repository's Releases page
   - Click "Draft a new release"
   - Select the tag you just pushed
   - Click "Publish release"

4. The workflow will automatically:
   - Validate the version matches
   - Build and zip the extension
   - Attach `send-to-gtask.zip` to the release

## Manual Trigger

To trigger a workflow manually:

1. Go to the Actions tab in the repository
2. Select the workflow
3. Click "Run workflow"

## Viewing Logs

Workflow run logs are available in the Actions tab. Each job and step is logged for debugging.

## Troubleshooting

### Version Mismatch Error

If you see "Tag version != Manifest version":

1. Check the tag you're trying to release
2. Ensure the `version` field in `src/manifest.json` matches (without the `v` prefix)
3. Tags should be formatted as `v1.0.0`, `v1.2.3`, etc.

### Build Failures

Check the workflow logs for:
- npm dependency errors
- TypeScript compilation errors
- Test failures

### Artifact Not Uploaded

Ensure the release was published (not just drafted). Draft releases don't trigger workflows.
