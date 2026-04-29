# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build       # Bundle src/ → dist/ using esbuild (IIFE format)
npm run typecheck   # Type-check only via tsc --noEmit (no emit)
npm test            # Run all tests once via vitest (jsdom environment)
npm run test:watch  # Run tests in watch mode
```

To run a single test file: `npx vitest run src/modal.test.ts`

Type-check before submitting changes.

## Architecture

`@inputbuffer/feedback` is a self-contained embeddable feedback widget distributed as a single script tag. It posts user feedback to the InputBuffer API.

**Module layout:**

- [src/index.ts](src/index.ts) — Entry point. Captures `document.currentScript` synchronously at load time, injects bundled CSS as `<style>` tags, exposes `window.InputBufferIO.createModal()` / `window.InputBufferIO.createBar()` / `window.InputBufferIO.version`, registers the `<inputbuffer-feedback>` custom element, and auto-initializes from `data-*` attributes on the script tag.
- [src/modal.ts](src/modal.ts) — Builds and manages the modal DOM, handles form validation (min 10 chars), submission lifecycle (disable → submit → success/error), and a simple pub/sub event system (`submit`, `close`, `error`).
- [src/bar.ts](src/bar.ts) — Builds the thumbs-up/down feedback bar with a popover form. Emits `vote`, `open`, `submit`, `close`, `error` events.
- [src/modal-entry.ts](src/modal-entry.ts) — Entry point for the modal-only bundle (`dist/modal.js`).
- [src/bar-entry.ts](src/bar-entry.ts) — Entry point for the bar-only bundle (`dist/bar.js`).
- [src/api.ts](src/api.ts) — POSTs to `https://inputbuffer.io/api/v0/inputs` with Bearer auth. Returns a feedback ID on success.
- [src/theme.ts](src/theme.ts) — Injects CSS custom properties (`--ib-primary`, `--ib-background`, `--ib-surface`, `--ib-text`, `--ib-selected`, `--ib-selected-color`) onto the modal element.
- [src/types.ts](src/types.ts) — All TypeScript interfaces: `WidgetConfig`, `OpenOptions`, `WidgetInstance`, `FeedbackBarConfig`, `FeedbackBarInstance`, `TargetSpec`.
- [src/modal.css](src/modal.css) / [src/bar.css](src/bar.css) — Component styles. All `#ib-*` IDs and `.ib-bar-*` / `.ib-bar-popover-*` classes are stable public API; users can override them.

**Initialization flow:**

1. Script tag loads → `currentScript` captured → CSS embedded in bundle is injected as `<style>` tags
2. Auto-init reads `data-api-key`, `data-attach-to`, `data-api-url`, `data-inject-styles`, `data-color-scheme`, and `data-theme-*` (primary, background, text, selected, selected-color) from the script tag
3. `createModal(config)` creates a `WidgetInstance`; if `attachTo` is set, a click listener opens the modal
4. `open(options?)` accepts runtime `target` metadata and `prefill` values
5. `createBar(config)` creates a `FeedbackBarInstance` with a thumbs bar and popover form
6. `<inputbuffer-feedback>` custom element provides a declarative HTML API for the bar

**Build:**

- Output: `dist/widget.js` (full bundle), `dist/modal.js` (modal only), `dist/bar.js` (bar only), `dist/modal.css`, `dist/bar.css`
- CSS is bundled as text inside the JS files and injected at runtime — no separate CSS file is needed when using the JS bundles
- Target: ES2019, Chrome 111+, Firefox 113+, Safari 16.2+
- Minified when `NODE_ENV=production` (`npm run build:prod`); source maps emitted in dev builds only
- Source maps are excluded from the npm package (`!dist/*.map` in `files`)

**Distribution:** Only `dist/` (excluding source maps) is published to npm (`files` in package.json). The example in [example/index.html](example/index.html) covers all usage patterns.
