# Implementation Plan: GitHub Actions CI/CD for Chrome Web Store Release

**Branch**: `004-github-actions-release` | **Date**: 2026-04-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/speckit.specify`

## Summary

Add GitHub Actions workflows to automate quality gates on pull requests and production builds on release. The workflows will run existing npm scripts (`check`, `build`, `zip`) and attach the ZIP artifact to GitHub Releases.

## Technical Context

**Language/Version**: GitHub Actions YAML (workflow syntax v2.4)  
**Primary Dependencies**: GitHub Actions, npm/npx (existing)  
**Storage**: N/A (workflow definitions in YAML files under `.github/workflows/`)  
**Testing**: Workflow runs existing `npm run check` (lint, type-check, vitest)  
**Target Platform**: GitHub Actions (cloud CI/CD)  
**Project Type**: Single project (Chrome Extension)  
**Performance Goals**: PR checks < 5 min, Release builds < 10 min  
**Constraints**: GitHub Actions limits (job time, artifact size), no secrets in code  
**Scale/Scope**: Single repository, few contributors  

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Test-First Development | ✅ N/A | CI/CD infrastructure, not application code. "Tests" are the workflow validations themselves. |
| Security & Privacy First | ✅ PASS | All secrets via GitHub Secrets. No credentials in code. |
| Simplicity & Direct Solutions | ✅ PASS | GitHub Actions is the standard solution for GitHub-hosted projects. No unnecessary tools. |
| Extension Performance | ✅ N/A | Workflows don't affect extension runtime performance. |

**GATE: All constitutional requirements satisfied.**

## Project Structure

### Documentation (this feature)

```text
specs/004-github-actions-release/
├── plan.md              # This file
├── spec.md              # Feature specification
├── checklists/          # Quality checklists
└── tasks.md             # (Phase 2 output - not created by /speckit.plan)
```

### Source Code Changes

```text
.github/
└── workflows/
    ├── ci.yml           # PR quality gates (lint, type-check, tests)
    └── release.yml      # Release builds and artifact upload

specs/004-github-actions-release/  (documentation only)
```

**Structure Decision**: GitHub Actions workflows live in `.github/workflows/` per GitHub convention. The `specs/` directory contains only documentation for this feature.

## Complexity Tracking

No constitutional violations to justify. The structure follows GitHub's standard conventions without over-engineering.

## Implementation Notes

### Workflow 1: CI (ci.yml)

Triggers on: `pull_request` events to `main` branch

Jobs:
1. **lint-and-check** - Runs `npm run lint` and `npm run type-check`
2. **test** - Runs `npm run test`

All jobs must pass for PR to be mergeable (via required status checks).

### Workflow 2: Release (release.yml)

Triggers on: `release` events (published releases)

Steps:
1. Checkout code
2. Validate version matches between tag and manifest.json
3. Run `npm run build`
4. Run `npm run zip`
5. Upload ZIP artifact to release

### Version Validation Logic

```bash
# Extract version from git tag (strip 'v' prefix)
TAG_VERSION=${GITHUB_REF#refs/tags/v}

# Extract version from manifest
MANIFEST_VERSION=$(grep -o '"version": "[^"]*"' manifest.json | cut -d'"' -f4)

# Compare and fail if mismatch
if [ "$TAG_VERSION" != "$MANIFEST_VERSION" ]; then
  echo "ERROR: Tag version ($TAG_VERSION) != Manifest version ($MANIFEST_VERSION)"
  exit 1
fi
```

### Secrets Required

The following secrets should be documented for repository maintainers (set via GitHub Settings > Secrets):

- `N/A` - No Google OAuth secrets needed for CI/CD. The release workflow only builds and zips the extension; it doesn't upload to the Chrome Web Store (that requires manual upload or Chrome Web Store API with separate credentials).
