# Data Model: GitHub Actions CI/CD

## Workflow Definitions

### CI Workflow (`ci.yml`)

**Triggers**: `pull_request` events targeting `main` branch

**Jobs**:

| Job | Purpose | Steps |
|-----|---------|-------|
| `lint-and-check` | Run linting and type checking | Checkout → Setup Node → Install deps → Run lint → Run type-check |
| `test` | Run test suite with coverage | Checkout → Setup Node → Install deps → Run tests |

**Artifacts**: Coverage report (HTML, JSON formats)

---

### Release Workflow (`release.yml`)

**Triggers**: `release` events with `types: [published]`

**Jobs**:

| Job | Purpose | Steps |
|-----|---------|-------|
| `build-and-release` | Validate version, build, and upload | Checkout → Setup Node → Validate version → Install deps → Build → Zip → Upload |

**Artifacts**: `send-to-gtask.zip` (uploaded to release)

---

## Version Validation

**Source of Truth**: Git tag format `v{version}` (e.g., `v1.0.0`)

**Validation Rules**:
1. Tag version (strip `v` prefix) MUST equal `manifest.json` version field
2. Validation happens before build to prevent mismatched releases
3. Mismatch causes workflow to fail with clear error message

**Example Validations**:

| Tag | Manifest Version | Result |
|-----|-----------------|--------|
| `v1.0.0` | `1.0.0` | ✅ Pass |
| `v1.2.3` | `1.2.3` | ✅ Pass |
| `v1.0.0` | `1.0.1` | ❌ Fail |
| `1.0.0` (no v) | `1.0.0` | ❌ Fail (tag format invalid) |

---

## Release Artifact

**Filename**: `send-to-gtask.zip`

**Contents**: 
- All files from `dist/` directory
- Production build of the Chrome Extension
- Ready for Chrome Web Store upload

**Naming Convention**: Single static filename (no version in filename - version is in release tag and manifest)

---

## State Transitions

### Pull Request States

```
OPEN → (checks run) → PENDING (in progress)
PENDING → (all pass) → SUCCESS ✓
PENDING → (any fail) → FAILURE ✗
```

### Release States

```
DRAFT → PUBLISHED → (workflow triggers) → IN_PROGRESS
IN_PROGRESS → (build succeeds) → COMPLETE with artifact ✓
IN_PROGRESS → (build fails) → FAILED ✗
```
