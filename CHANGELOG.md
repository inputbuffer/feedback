# Changelog

All notable changes to `@inputbuffer/feedback` will be documented here.

## [0.3.0] - 2026-09-06

Realigns the widget with the current InputBuffer API. The previous release sends a payload
the server no longer accepts, so **upgrading is required** for the widget to keep working.

### Breaking

- **The feedback endpoint moved from `/api/v0/inputs` to `/api/v0/feedback`.** Submissions from
  0.2.0 and earlier no longer reach a live endpoint.
- **`apiUrl` is now a base origin, not a full endpoint URL.** Pass `https://inputbuffer.io` or
  `http://localhost:8080`; the widget appends `/api/v0/feedback` and `/api/v0/reactions` itself.
  Anything passing a full `.../api/v0/inputs` URL must drop the path. This also fixes the
  reactions URL, which was derived by string-replacing `/inputs` and silently broke.
- **The email field is gone.** The API has no `contact_email` field. `showEmailField`,
  the `show-email-field` attribute, `prefill.email`, and the email inputs in both the modal
  and the bar have been removed, along with the `#ib-email` / `.ib-bar-email` selectors.
  Use `submittedBy` to identify the submitter.
- **`source` has been removed** from `WidgetConfig`, `FeedbackBarConfig`, `OpenOptions`, and the
  `source` attribute. The API has no such field; it was being sent and discarded.
- **`target.metadata` is now required** whenever a target is set, matching the API. The
  invented `targetId`, `displayName`, and `dedupKey` properties never existed on the wire and
  are gone from the types and the docs.
- **`ApiError.category` is now `'user' | 'integration'`** (was `'config' | 'user'`), and problem
  type URIs moved to `https://inputbuffer.io/docs/api/problems/*`.
- **`submitFeedback()` dropped its `email` parameter**, shifting `title`, `options`, and `apiUrl`
  down one position. Only relevant if you import it directly.

### Added

- **`submittedBy` config option** (`submitted-by` / `data-submitted-by` attributes) — an opaque
  identifier for whoever submitted the feedback, sent as `submitted_by`.
- **Declarative targets** — `target-type` plus `target-page-url`, `target-method`, `target-path`,
  `target-command`, and the rest of the per-type metadata attributes. Reactions were previously
  unreachable from an HTML-only embed, because neither custom element could express a target.
  `target-type="documentation"` defaults `page_url` to the current page.
- **Console diagnostics for misconfigured embeds.** A `403 widget-token-restricted`, a
  `403 forbidden-origin`, or a reaction rejected for having no `user_id` and no client IP now
  logs the reason instead of showing the user a generic message and vanishing.
- **`submitReaction()` returns the recorded reaction**, including the resolved target and its id.
- Field lengths are clamped to the API's limits (description 5000, title 500, `submitted_by` 300)
  rather than being rejected with a `422`.
- Test coverage for `submitReaction`, attribute parsing, and endpoint construction.

### Fixed

- **`dist/bar.js` now honors every documented attribute.** Its custom element read only 6 of the
  13 attributes the docs promise, silently ignoring `color-scheme`, `show-label`, `modal-title`,
  `modal-placeholder`, `show-title-field`, and `user-id`. Attribute parsing is now shared between
  the bundles so they cannot drift again.
- **`dist/modal.js` auto-init now reads `data-color-scheme`** (plus `data-title`,
  `data-placeholder`, `data-show-title-field`, and `data-show-sentiment`), which only the full
  bundle handled.
- README no longer documents fields that do not exist (`targetId`, `displayName`, `dedupKey`,
  `page_slug`), and correctly marks `page_url`, `method`/`path`, and `command` as required.

---

## [0.2.0] - 2025

### Added

- **Reactions API** — thumbs up/down votes now POST to `/api/v0/reactions` immediately on click (best-effort, fire-and-forget). Reaction state is persisted to `localStorage` with a 24-hour TTL so the selected vote is restored on revisit.
- **`<inputbuffer-feedback>` custom element** — declarative HTML API for the feedback bar; supports all `FeedbackBarConfig` options as element attributes (`api-key`, `placement`, `color-scheme`, `show-label`, `modal-title`, `modal-placeholder`, `show-title-field`, `show-email-field`, `source`, `user-id`, `theme-*`).
- **`userId` config option** — attach an optional user identifier to reaction submissions (`FeedbackBarConfig.userId` / `user-id` attribute).
- **`source` config option** — tag submissions with a source string on both the bar and modal widgets.
- **Improved overflow/popover positioning** — popover repositions on `scroll` and `resize` events using `getBoundingClientRect`, replacing the previous static placement. `requestAnimationFrame` is used so `offsetHeight` is accurate when first opening.
- **Split bundles** — `dist/modal.js` and `dist/bar.js` entry points added alongside the full `dist/widget.js` bundle, exposed via `package.json` `exports` (`./modal`, `./bar`).
- **ESM bundles** — `dist/widget.esm.js`, `dist/modal.esm.js`, and `dist/bar.esm.js` added for module consumers.
- **`X-IB-Client` header** — all API requests now include `X-IB-Client: inputbuffer-widget/<version> (javascript)` for server-side client identification.

### Changed

- `createFeedbackBar` popover now closes and clears the vote selection automatically 2 seconds after a successful submission (matches modal behavior).
- Error display distinguishes user-facing errors (`ApiError.category === 'user'`) from internal errors — user errors show the API's `detail` message directly.

### Fixed

- Popover no longer remains open when clicking outside the widget while the page has scroll position.
- Style injection guards (`document.getElementById('ib-bar-styles')`) prevent duplicate `<style>` tags when multiple instances are created.

---

## [0.1.0] — Initial release

- `createModal(config)` — feedback modal with form validation (min 10 chars), sentiment buttons (thumbs up/down), optional title and email fields, theming via CSS custom properties, `attachTo` click binding, and `submit` / `close` / `error` events.
- `createBar(config)` — inline or fixed thumbs bar with popover form and the same field/event/theme options.
- Auto-init from `data-*` attributes on the script tag (`data-api-key`, `data-attach-to`, `data-color-scheme`, `data-theme-*`, etc.).
- Color scheme support: `dark`, `light`, `auto`.
- `TargetSpec` types: `rest_endpoint`, `documentation`, `cli_command` — attach structured metadata to submissions.
- `prefill` support on `open()` — pre-populate email and description fields at runtime.
- 10-second fetch timeout with `AbortController` on all API requests.
- CSS injected at runtime from bundled text — no separate stylesheet required.
