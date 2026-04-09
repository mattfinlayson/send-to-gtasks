# Quickstart: Chrome Web Store Publication

**Feature**: 003-webstore-publish
**Branch**: `003-webstore-publish`

---

## Prerequisites

- Node.js 20+ (`node --version`)
- npm 10+
- Chrome browser (for manual extension loading)
- Access to the Chrome Web Store developer account (for final upload only)

---

## Setup

```bash
git checkout 003-webstore-publish
npm install
```

---

## Work Order

This feature has no TDD cycle for most tasks (documentation, config files) — the acceptance criteria are verified by running commands or reading files. The one exception is the Biome setup, which follows a configuration-verify loop.

### Step 1: Create LICENSE file

Create `/LICENSE` at repo root with MIT License text (see `research.md` Decision 5 for exact text). Verify: `cat LICENSE` shows correct text.

### Step 2: Update package.json

- Confirm `"license": "MIT"` is set (it already is)
- Add `"zip"` script
- Remove `eslint`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser` from devDependencies
- Add `"@biomejs/biome"` to devDependencies
- Add `"check"` script

### Step 3: Set up Biome

```bash
npm install --save-dev @biomejs/biome
npx @biomejs/biome init   # creates biome.json scaffold
# Edit biome.json to match code style (see plan.md for config)
npx @biomejs/biome format --write src/   # apply formatting
git diff src/   # review formatting changes — should be minimal
npx @biomejs/biome check src/   # verify zero violations
```

Remove ESLint after Biome is confirmed:
```bash
npm uninstall eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
rm eslint.config.js
```

### Step 4: Update npm scripts

After Biome is working:
```bash
# Verify the full check pipeline
npm run check   # should exit 0
npm run build   # should succeed
npm run zip     # should produce send-to-gtask.zip
```

### Step 5: Update README.md

Edit `README.md` to add missing content per `research.md` Decision 8.

### Step 6: Final code review

Run `browser-extension-developer` agent to audit all files in `src/` and produce a findings report. Address all Critical and High findings.

### Step 7: Prepare store submission

- Follow the checklist in `contracts/store-listing.md`
- Use the copy from `contracts/store-listing.md` when filling in the developer dashboard

---

## Key Verification Commands

```bash
npm run check         # Biome lint + format + type-check + tests — must exit 0
npm run build         # Must produce clean output in dist/
npm run zip           # Must produce send-to-gtask.zip
```

---

## File Map

| File | Change |
|---|---|
| `LICENSE` | New — MIT License text |
| `README.md` | Update — fill gaps from research.md Decision 8 |
| `biome.json` | New — Biome configuration |
| `eslint.config.js` | Delete — replaced by Biome |
| `package.json` | Update — deps, scripts |
| `src/manifest.json` | Verify version is `1.0.0` |
| `specs/003-webstore-publish/contracts/store-listing.md` | New — ready for upload |
