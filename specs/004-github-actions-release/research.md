# Research: GitHub Actions CI/CD for Chrome Web Store Release

## Decisions Made

### 1. GitHub Actions as CI/CD Platform

**Decision**: Use GitHub Actions (native to GitHub)

**Rationale**: 
- This is a GitHub-hosted project, so GitHub Actions is the most natural fit
- No external CI/CD service configuration needed
- Native integration with GitHub releases and secrets
- Free for public repositories with generous minutes

**Alternatives considered**:
- Travis CI: More complex setup, requires separate service
- CircleCI: Requires separate account and configuration
- Jenkins: Self-hosted required, overkill for single-project needs

---

### 2. Two-Workflow Architecture

**Decision**: Separate `ci.yml` and `release.yml` workflows

**Rationale**:
- `ci.yml` runs on every PR (fast feedback, no secrets needed)
- `release.yml` only runs on releases (slower, artifact generation)
- Separation of concerns following GitHub Actions best practices
- Easier to debug and maintain

**Alternatives considered**:
- Single workflow with conditional jobs: More complex, harder to understand
- Three workflows (ci, test, release): Over-engineered for this project size

---

### 3. Node.js Version

**Decision**: Use `actions/setup-node@v4` with Node.js 22 (current LTS per npm's requirements)

**Rationale**:
- Project uses `"type": "module"` and modern npm features
- Node 22 has best support for ESM and modern JavaScript tooling
- `setup-node` action handles caching automatically

---

### 4. Artifact Upload Strategy

**Decision**: Use `actions/upload-release-asset@v2` for release artifacts

**Rationale**:
- Native GitHub Actions integration
- Automatically associates artifact with release
- Clean download URLs for users

**Alternatives considered**:
- `softprops/action-gh-release`: More features but adds external dependency
- Manual artifact upload: More complex, requires more steps

---

## Implementation Patterns

### Version Validation Pattern

```yaml
- name: Validate version matches tag
  run: |
    TAG_VERSION=${GITHUB_REF#refs/tags/v}
    MANIFEST_VERSION=$(grep -o '"version": "[^"]*"' src/manifest.json | cut -d'"' -f4)
    if [ "$TAG_VERSION" != "$MANIFEST_VERSION" ]; then
      echo "Error: Tag version ($TAG_VERSION) != Manifest version ($MANIFEST_VERSION)"
      exit 1
    fi
```

### npm Dependency Caching Pattern

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '22'
    cache: 'npm'
```

---

## Best Practices Applied

1. **Matrix strategy**: Not needed (single Node version)
2. **Fail-fast**: CI workflow uses default fail-fast behavior
3. **Concurrency control**: CI workflow should cancel in-progress runs on new push
4. **Artifact retention**: Release artifacts inherit repository retention policy (90 days default)
5. **Checkout depth**: `fetch-depth: 0` needed for release workflow to access tags
6. **Path filtering**: Not needed (workflow-level triggers are sufficient)

---

## External Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow syntax for GitHub Actions](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Reusing workflows](https://docs.github.com/en/actions/using-workflows/reusing-workflows)
- [Encrypted secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
