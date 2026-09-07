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
- [src/api.ts](src/api.ts) — `submitFeedback()` POSTs to `/api/v0/feedback` and returns a feedback ID; `submitReaction()` POSTs to `/api/v0/reactions` and returns the recorded reaction with its resolved target. Both compose their URL from a base origin (`apiUrl`, defaulting to `https://inputbuffer.io`) plus a fixed path, share one `request()` helper for Bearer auth / `X-IB-Client` / the 10s timeout, and clamp field lengths to the API's limits.
- [src/attrs.ts](src/attrs.ts) — Shared attribute parsing for the declarative entry points: `barConfigFromElement()`, `modalConfigFromScript()`, `targetFromAttributes()`. All three entry points delegate here so the bundles cannot support different attribute sets.
- [src/errors.ts](src/errors.ts) — `userFacingMessage()` picks what to show the end user: `category: 'user'` problems show the API's `detail`, `category: 'integration'` problems show a generic message and log the real reason via `warn()`.
- [src/theme.ts](src/theme.ts) — Injects CSS custom properties (`--ib-primary`, `--ib-background`, `--ib-surface`, `--ib-text`, `--ib-selected`, `--ib-selected-color`) onto the modal element.
- [src/types.ts](src/types.ts) — All TypeScript interfaces: `WidgetConfig`, `OpenOptions`, `WidgetInstance`, `FeedbackBarConfig`, `FeedbackBarInstance`, `TargetSpec`, `ReactionResult`, plus `ProblemType` / `ProblemDetails` / `ApiError` mirroring the API's RFC 7807 errors.

**API contract:** the source of truth is <https://inputbuffer.io/docs/api/openapi.yaml>. Check it before changing any payload. Notable constraints: the widget needs a widget-scoped token (`ibw_`, origin-allowlisted — a full-access `ib_` token is rejected from a browser); `FeedbackCreate` accepts only `title`, `description`, `submitted_by`, and `targets`; a target's `metadata` is required and each type has its own required fields; reactions take a singular `target` while feedback takes a `targets` array.
- [src/modal.css](src/modal.css) / [src/bar.css](src/bar.css) — Component styles. All `#ib-*` IDs and `.ib-bar-*` / `.ib-bar-popover-*` classes are stable public API; users can override them.

**Initialization flow:**

1. Script tag loads → `currentScript` captured → CSS embedded in bundle is injected as `<style>` tags
2. Auto-init reads the script tag's `data-*` attributes via `modalConfigFromScript()`
3. `createModal(config)` creates a `WidgetInstance`; if `attachTo` is set, a click listener opens the modal
4. `open(options?)` accepts a runtime `target`, `prefill.description`, `title`, `sentiment`, and `submittedBy`
5. `createBar(config)` creates a `FeedbackBarInstance` with a thumbs bar and popover form; a thumb click fires a fire-and-forget reaction when a `target` is configured
6. `<inputbuffer-feedback>` custom element provides a declarative HTML API for the bar, including `target-*` attributes

**Build:**

- Output: `dist/widget.js` (full bundle), `dist/modal.js` (modal only), `dist/bar.js` (bar only), `dist/modal.css`, `dist/bar.css`
- CSS is bundled as text inside the JS files and injected at runtime — no separate CSS file is needed when using the JS bundles
- Target: ES2019, Chrome 111+, Firefox 113+, Safari 16.2+
- Minified when `NODE_ENV=production` (`npm run build:prod`); source maps emitted in dev builds only
- Source maps are excluded from the npm package (`!dist/*.map` in `files`)

**Distribution:** Only `dist/` (excluding source maps) is published to npm (`files` in package.json). The example in [example/index.html](example/index.html) covers all usage patterns.
