# Research: Chrome Web Store Publication

**Feature**: 003-webstore-publish
**Date**: 2026-04-08

---

## Decision 1: Biome Version and Configuration Format

**Decision**: Use Biome 1.x (latest stable) with a `biome.json` config file at the project root. Biome replaces `eslint`, `@typescript-eslint/eslint-plugin`, and `@typescript-eslint/parser` entirely.

**Rationale**: Biome is a single Rust-based tool that handles linting AND formatting with zero configuration for most rules. It is 10-100x faster than ESLint + Prettier, has first-class TypeScript support, and produces consistent output without the ESLint + separate formatter coordination overhead. The codebase is pure TypeScript so no mixed-language concerns.

**Alternatives considered**:
- Keep ESLint: Already in use, but requires two separate tools (ESLint + a formatter), additional packages, and is slower. Biome covers the same surface with less config.
- ESLint + Prettier: Standard pairing but adds a third config file and requires an eslint-prettier compatibility plugin. Rejected for simplicity.

---

## Decision 2: Biome Code Style Configuration

**Decision**: Configure Biome to match the existing codebase style:
- `formatter.semicolons`: `"asNeeded"` — the codebase uses NO semicolons (confirmed in all TypeScript source files)
- `formatter.quoteStyle`: `"single"` — all imports use single quotes (`'vite'`, `'path'`, etc.)
- `formatter.indentStyle`: `"space"`
- `formatter.indentWidth`: `2`
- `formatter.trailingCommas`: `"all"` — modern ES2017+ trailing commas in all positions
- `linter.rules.recommended`: `true` — enable all recommended rules as baseline

**Rationale**: Matching the existing style means `biome format` produces zero diff on committed code, so no formatting-only commits are needed before enabling the gate. This is critical to avoid a large noise commit.

**Important note**: Biome's `format` command will need to be run once and the diff committed BEFORE adding the format check to the pipeline gate. Expect some whitespace normalization in files.

---

## Decision 3: Biome Rule Mapping from ESLint

**Decision**: Map the three current ESLint rules to Biome equivalents:

| ESLint rule | Biome equivalent | Notes |
|---|---|---|
| `@typescript-eslint/no-explicit-any: warn` | `suspicious.noExplicitAny` (error) | Biome doesn't support warn-only; use error or disable. Use error. |
| `@typescript-eslint/no-floating-promises: error` | Not available (requires type info) | Biome doesn't support type-aware rules. Drop this rule — TypeScript strict mode catches most cases, and the `no-floating-promises` ESLint rule was the primary motivation for ESLint. Compensate by ensuring `noUnusedLocals` catches discarded promises via unused vars. |
| `@typescript-eslint/no-unused-vars: error` | `correctness.noUnusedVariables` | Built into Biome recommended. |

**Rationale**: Biome's linter is not type-aware (it doesn't read TypeScript type information), so type-dependent rules like `no-floating-promises` cannot be replicated. The feature that was catching floating promises in the codebase — `async handleRetry` — was already fixed in feature 002. The risk of silent floating promises is low given strict mode and the existing codebase patterns.

---

## Decision 4: `check` Script Composition

**Decision**: The new `npm run check` script runs four steps in sequence:
```
biome check src/ && tsc --noEmit --project tsconfig.test.json && vitest run --coverage
```

`biome check` combines lint + format check in one command. `tsc --noEmit` type-checks. `vitest run --coverage` runs tests with coverage enforcement (80% threshold already configured).

**Alternatives considered**:
- Separate `lint` and `format` scripts: Biome already combines them. Having both is redundant.
- Keep `type-check` as a separate named script and chain it: Better DX — keep `type-check` as a standalone script AND include it in `check`. Both exist.

---

## Decision 5: MIT License Text and Copyright Holder

**Decision**: Use the standard OSI-approved MIT License text. Copyright holder: `Matthew Finlayson`. Year: `2026`.

```
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

---

## Decision 6: Chrome Web Store Listing Copy

**Decision**: Prepare store copy as a contract document (`contracts/store-listing.md`) ready for copy-paste into the Chrome Web Store developer dashboard. Key fields:

- **Extension name**: `Send to Google Tasks`
- **Short description** (≤132 chars): `Save any web page as a Google Task with one click. Captures the title and URL automatically.` (91 chars ✓)
- **Category**: `Productivity`
- **Language**: `English (United States)`

**Long description** will cover: what it does, key features, how to use, required permissions with plain-language explanations, and a note about the open-source nature.

**Rationale**: Having the copy in a versioned document means it can be reviewed before manual upload, and updated without losing the prior version.

---

## Decision 7: Production ZIP Creation

**Decision**: Production ZIP is created manually by the developer by running `npm run build` then zipping the `dist/` directory. Add a `zip` convenience script to `package.json`:
```json
"zip": "npm run build && cd dist && zip -r ../send-to-gtask.zip . && cd .."
```

The resulting `send-to-gtask.zip` is the file uploaded to the Chrome Web Store developer dashboard. Add `*.zip` to `.gitignore`.

---

## Decision 8: README Gaps to Fill

The existing `README.md` is a solid starting point but needs these additions:
1. `alarms` permission — added in feature 002 but not documented
2. `type-check` and `test:ci` scripts — added in feature 002
3. Production build → ZIP → upload workflow
4. Development branching and commit conventions
5. Quality gate pipeline description (`npm run check`)
6. Minimum Node.js version callout (Node 18+ already mentioned — update to Node 20+)
7. `chrome.storage.session` usage note in permissions section

---

## Decision 9: Final Code Review Scope

**Decision**: The final code review will be conducted by the `browser-extension-developer` agent during implementation, auditing all files in `src/`. The review will focus on:
1. Idiomatic TypeScript patterns (unnecessary type assertions, non-idiomatic async patterns)
2. Any dead code or exports not used outside the module
3. Consistency of error handling patterns
4. Any hardcoded values that should be constants
5. Security: any remaining XSS, injection, or token exposure risks

Findings are categorized as Critical, High, Medium, Low and all Critical + High must be resolved before the feature is merged.
