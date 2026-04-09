# Implementation Plan: Chrome Web Store Publication

**Branch**: `003-webstore-publish` | **Date**: 2026-04-08 | **Spec**: [spec.md](./spec.md)

## Summary

Prepare the send-to-gtask extension for public release on the Chrome Web Store. Five workstreams: (A) MIT License, (B) store listing copy, (C) README completion, (D) replace ESLint with Biome + unified `check` pipeline, (E) final idiomatic code review. All workstreams are independent and can proceed in any order.

## Technical Context

**Language/Version**: TypeScript 5.4+ (strict mode) — no changes to extension code  
**Primary Dependencies**: `@biomejs/biome` (new, replaces ESLint); `eslint` + `@typescript-eslint/*` (removed)  
**Storage**: N/A  
**Testing**: Vitest 1.x — existing 80% coverage thresholds remain; no new test files  
**Target Platform**: Chrome Extension MV3 — no changes to extension behaviour  
**Project Type**: Single project  
**Performance Goals**: `npm run check` completes in under 10 seconds  
**Constraints**: Biome does not support type-aware lint rules — `no-floating-promises` is dropped (see research.md Decision 3)

## Constitution Check

### I. Test-First Development ✅

This feature is documentation and tooling configuration — not application logic. TDD does not apply to LICENSE files, README, or Biome config. For any code changes surfaced by the final code review, TDD applies: write a failing test, then fix.

### II. Security & Privacy First ✅

The store listing (`contracts/store-listing.md`) accurately describes data usage and includes the required Chrome Web Store privacy practices disclosure. No new data collection introduced.

### III. Simplicity & Direct Solutions ✅

Biome reduces 3 ESLint packages → 1 Biome package, and 1 ESLint config file → 1 biome.json. Simpler, not more complex.

### IV. Extension Performance Standards ✅

Biome is dev-only tooling — not bundled into the extension. No bundle size impact.

**Constitution Check Result**: PASS — no violations

## Project Structure

### Documentation (this feature)

```text
specs/003-webstore-publish/
├── plan.md                         # This file
├── research.md                     # All 9 decisions resolved
├── quickstart.md                   # Step-by-step dev guide
├── contracts/
│   └── store-listing.md            # Chrome Web Store listing copy (ready to upload)
└── tasks.md                        # /speckit.tasks output (not yet created)
```

### Files Changed/Created

```text
LICENSE                             # New — MIT License text
README.md                           # Updated — 6 documented gaps filled
biome.json                          # New — Biome lint + format config
eslint.config.js                    # Deleted — replaced by Biome
package.json                        # Updated — deps, new scripts, zip script
.gitignore                          # Updated — add *.zip
src/**/*.ts                         # Formatting applied by biome format --write
```

## Phase 0: Research — Complete

All 9 decisions resolved. See [research.md](./research.md).

| Decision | Resolution |
|---|---|
| Biome version | `@biomejs/biome` 1.x, `biome.json` config |
| Code style | No semicolons, single quotes, 2-space indent, trailing commas `"all"` |
| ESLint → Biome mapping | `noExplicitAny` kept; `no-floating-promises` dropped (type-aware, unsupported); `no-unused-vars` → Biome recommended |
| `check` script | `biome check src/ && tsc --noEmit --project tsconfig.test.json && vitest run --coverage` |
| MIT License | OSI text, copyright Matthew Finlayson 2026 |
| Store listing | Prepared in `contracts/store-listing.md` |
| Production ZIP | `npm run zip` convenience script |
| README gaps | 6 gaps: alarms permission, type-check/check scripts, zip/submission workflow, dev branching, Node 20+ |
| Final review scope | All 9 files in `src/`, browser-extension-developer agent |

## Phase 1: Design — Complete

### No Data Model

No new entities, storage keys, or API calls. Existing data model unchanged.

### Contract: Store Listing

Full Chrome Web Store submission package in [contracts/store-listing.md](./contracts/store-listing.md):
- Extension name, short description (91 chars), detailed description
- Privacy practices answers
- Store assets checklist
- Pre-submission developer checklist

### Workstream A: MIT License (US2, P1)

**Files**: `LICENSE` (new)

```text
MIT License

Copyright (c) 2026 Matthew Finlayson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

`package.json` already has `"license": "MIT"` — no change needed.

---

### Workstream B: Store Listing (US1, P1)

**Files**: `contracts/store-listing.md` (already done), `package.json` (zip script), `.gitignore`

Add `"zip"` script to `package.json`:
```json
"zip": "npm run build && cd dist && zip -r ../send-to-gtask.zip . && cd .."
```

Add to `.gitignore`:
```
*.zip
```

`src/manifest.json` `"version": "1.0.0"` is already correct — no change.

---

### Workstream C: README Update (US3, P2)

**File**: `README.md`

Six specific additions to the existing README:

1. **Prerequisites**: `Node.js 20+` (from 18+), add `npm 10+`

2. **Permissions section**: Add `alarms` entry:
   > **alarms**: To clear the badge indicator on the extension icon a few seconds after a task is created. No background scheduling occurs.

3. **Scripts table**: Add entries for `type-check`, `test:ci`, and `check`

4. **Quality gate section** (new subsection under Development):
   ```
   npm run check
   ```
   Runs Biome lint + format check, TypeScript type-check, and the full test suite with coverage. Must exit 0 before committing.

5. **Production build & store submission** (new subsection):
   ```bash
   npm run zip       # builds and packages dist/ into send-to-gtask.zip
   ```
   Upload `send-to-gtask.zip` to the Chrome Web Store developer dashboard. Prepared listing copy is in `specs/003-webstore-publish/contracts/store-listing.md`.

6. **Development workflow** (new subsection):
   - Branch naming: `NNN-short-description` (e.g., `003-webstore-publish`)
   - Commit style: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:` prefixes
   - Quality gate: `npm run check` must pass before every commit

---

### Workstream D: Biome Setup (US4, P2)

**Files**: `biome.json` (new), `eslint.config.js` (deleted), `package.json` (updated)

**`biome.json`** content:
```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noExplicitAny": "error"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all",
      "semicolons": "asNeeded"
    }
  },
  "files": {
    "include": ["src/**/*.ts"],
    "ignore": ["dist/**", "node_modules/**", "coverage/**"]
  }
}
```

**`package.json` scripts**:

Remove:
- `"lint": "eslint src --ext .ts"`
- `"lint:fix": "eslint src --ext .ts --fix"`

Add/replace:
- `"lint": "biome lint src/"`
- `"format": "biome format --write src/"`
- `"check": "biome check src/ && tsc --noEmit --project tsconfig.test.json && vitest run --coverage"`
- `"zip": "npm run build && cd dist && zip -r ../send-to-gtask.zip . && cd .."`

**`package.json` devDependencies**:

Remove: `eslint`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`
Add: `"@biomejs/biome": "^1.9.4"` (or latest 1.x)

**Process**:
1. Install: `npm install --save-dev @biomejs/biome`
2. Create `biome.json` with config above
3. Run `npx @biomejs/biome format --write src/` — apply formatting
4. Commit the formatting diff as a standalone commit: `"Apply Biome formatting"`
5. Run `npx @biomejs/biome check src/` — fix any remaining lint violations
6. Remove ESLint: `npm uninstall eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser && rm eslint.config.js`
7. Verify: `npm run check` exits 0

**Note on formatting commit**: The formatting diff is expected to be minor (Biome and the existing style align closely) but must be its own commit to keep the history clean and the diff reviewable.

---

### Workstream E: Final Code Review (US5, P3)

**Agent**: `browser-extension-developer`

Files to review: all 9 TypeScript files in `src/`

Focus areas:
1. Non-idiomatic TypeScript (type assertions, `any` escapes, awkward async patterns)
2. Dead code (unexported symbols, unreachable branches)
3. Error handling consistency
4. Hardcoded values that should be named constants
5. Security: token handling, XSS risks, injection risks

Output: findings list with severity (Critical / High / Medium / Low). All Critical and High items fixed via TDD before merge.
