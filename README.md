# @inputbuffer/feedback

[InputBuffer](https://inputbuffer.io) is a feedback platform built for developer-facing products. It collects feedback from your users and uses AI-driven categorization to surface patterns.

This package is a lightweight embeddable widget you can drop into your documentation sites, API and SDK references, CLI docs, or any other web property.

---

## Table of contents

- [Quick start](#quick-start)
  - [Inline thumbs bar](#inline-thumbs-bar-web-component)
  - [Thumbs only](#thumbs-only-web-component)
  - [Label only, no thumbs](#label-only-no-thumbs-web-component)
  - [Floating thumbs bar](#floating-thumbs-bar-web-component)
  - [Modal](#modal-script-tag)
  - [Verify it's working](#verify-its-working)
  - [Troubleshooting](#troubleshooting)
- [Installation](#installation)
  - [CDN](#cdn-recommended)
  - [npm](#npm)
  - [Browser support](#browser-support)
- [Authentication](#authentication)
- [Reference](#reference)
- [Feedback bar](#feedback-bar)
  - [Web component](#web-component)
  - [`createBar(config)`](#inputbufferiocreatebarconfig)
  - [`bar.on(event, handler)`](#baronevent-handler)
  - [`bar.open(sentiment?)`](#baropensentiment)
  - [`bar.close()`](#barclose)
  - [`bar.destroy()`](#bardestroy)
- [Feedback modal](#feedback-modal)
  - [Script tag attributes](#script-tag-attributes-auto-init)
  - [`createModal(config)`](#inputbufferiocreatemodal config)
  - [`instance.open(options?)`](#instanceopenoptions)
  - [`instance.close()`](#instanceclose)
  - [`instance.destroy()`](#instancedestroy)
  - [`instance.on(event, handler)`](#instanceonevent-handler)
  - [`InputBufferIO.version`](#inputbufferioversion)
- [Targets](#targets)
  - [Target metadata schemas](#target-metadata-schemas)
  - [Target attributes](#target-attributes)
- [Errors](#errors)
- [CSS customization](#css-customization)
  - [Modal selectors](#modal-selectors)
  - [Bar selectors](#bar-selectors)
  - [CSS custom properties](#css-custom-properties)
- [Common tasks](#common-tasks)
- [License](#license)

---

## Quick start

Before you start you will need a **widget token** (`ibw_…`) from your [InputBuffer dashboard](https://inputbuffer.io) — see [Authentication](#authentication). Widget tokens are designed to be embedded in a browser; your full-access `ib_…` token is not and will be rejected.

There are three bundles — pick the one that matches your use case:

| Bundle | Size | What it includes |
|---|---|---|
| `bar.js` | 18 KB | Thumbs up/down bar with optional follow-up form |
| `modal.js` | 16 KB | Full-text feedback modal |
| `widget.js` | 32 KB | Both bar and modal |

### Inline thumbs bar (web component)

The simplest way to add feedback. Drop the script tag anywhere in your page, then place the web component where you want the bar to appear:

```html
<script src="https://cdn.jsdelivr.net/npm/@inputbuffer/feedback/dist/bar.js"></script>

<inputbuffer-feedback
  api-key="YOUR_WIDGET_TOKEN"
  label="Was this helpful?">
</inputbuffer-feedback>
```

The bar renders inline with thumbs up/down buttons. After a vote, a short follow-up form appears so the user can add context. On submit, the feedback is sent to InputBuffer.

| Light | Dark |
|---|---|
| ![Bar light](example/bar-light.png) | ![Bar dark](example/bar-dark.png) |

### Thumbs only (web component)

Omit the `label` attribute to show just the thumbs with no text:

```html
<script src="https://cdn.jsdelivr.net/npm/@inputbuffer/feedback/dist/bar.js"></script>

<inputbuffer-feedback api-key="YOUR_WIDGET_TOKEN"></inputbuffer-feedback>
```

| Light | Dark |
|---|---|
| ![Thumbs light](example/thumbs-light.png) | ![Thumbs dark](example/thumbs-dark.png) |

### Label only, no thumbs (web component)

Set `show-thumbs="false"` when you want a plain "leave feedback" strip rather than a rating. The
whole bar becomes a single button that opens the follow-up form, so give `label` an action-oriented
wording. No sentiment is attached and no reaction is recorded:

```html
<script src="https://cdn.jsdelivr.net/npm/@inputbuffer/feedback/dist/bar.js"></script>

<inputbuffer-feedback
  api-key="YOUR_WIDGET_TOKEN"
  label="Give feedback"
  show-thumbs="false">
</inputbuffer-feedback>
```

`show-label="false"` is ignored here — with the thumbs gone, the label is the only way in.

### Floating thumbs bar (web component)

Add `placement="fixed"` to pin the bar to the bottom of the viewport — useful for documentation pages where you want persistent feedback access:

```html
<script src="https://cdn.jsdelivr.net/npm/@inputbuffer/feedback/dist/bar.js"></script>

<inputbuffer-feedback
  api-key="YOUR_WIDGET_TOKEN"
  label="Was this helpful?"
  placement="fixed">
</inputbuffer-feedback>
```

### Modal (script tag)

If you want a full-text feedback modal triggered by a button, load `modal.js` with your API key and a CSS selector for the trigger element:

| Light | Dark |
|---|---|
| ![Modal light](example/modal-light.png) | ![Modal dark](example/modal-dark.png) |

```html
<button id="feedback-btn">Send feedback</button>

<script src="https://cdn.jsdelivr.net/npm/@inputbuffer/feedback/dist/modal.js"
    data-api-key="YOUR_WIDGET_TOKEN"
    data-attach-to="#feedback-btn">
</script>
```

When the page loads the widget connects to `#feedback-btn`. Clicking it opens a modal with a text field and an optional title field.

### Verify it's working

Submit a test message from your page and open your InputBuffer dashboard. It should appear in your feedback inbox within a few seconds, already categorized.

### Troubleshooting

- **Nothing happens on click:** check that the `data-attach-to` selector matches your button's `id` exactly, including the `#`.
- **401 error:** your `data-api-key` is invalid — try again with a fresh copy from the dashboard, and if it still fails [contact us](https://inputbuffer.io/contact).
- **403 error:** either you used a full-access `ib_…` token instead of a widget `ibw_…` token, or the page's origin is not on your token's allowlist. The widget logs the specific reason to the browser console — see [Errors](#errors).

### Where to go from here

- Customize the bar with `label`, `placement`, and theme attributes (see [Web component](#web-component))
- Create the bar programmatically with `createBar()` for full config access (see [`InputBufferIO.createBar(config)`](#inputbuffercreatebarconfig))
- Listen for vote and submit events (see [`bar.on(event, handler)`](#baronevent-handler))

---

## Installation

### CDN (recommended)

Load only the component you need — each is roughly half the full bundle:

```html
<!-- Full bundle (modal + bar) — 32 KB -->
<script src="https://cdn.jsdelivr.net/npm/@inputbuffer/feedback/dist/widget.js"
    data-api-key="YOUR_WIDGET_TOKEN">
</script>

<!-- Modal only — 16 KB -->
<script src="https://cdn.jsdelivr.net/npm/@inputbuffer/feedback/dist/modal.js"
    data-api-key="YOUR_WIDGET_TOKEN">
</script>

<!-- Bar only — 18 KB -->
<script src="https://cdn.jsdelivr.net/npm/@inputbuffer/feedback/dist/bar.js"></script>
```

> **SRI note:** For production deployments, add a Subresource Integrity `integrity` attribute to guard against CDN compromise. Generate the hash for each pinned version with:
> ```bash
> curl -s https://cdn.jsdelivr.net/npm/@inputbuffer/feedback@0.3.0/dist/widget.js | openssl dgst -sha384 -binary | openssl base64 -A
> ```
> Then use `integrity="sha384-<hash>" crossorigin="anonymous"` on the `<script>` tag.

The stylesheet is injected automatically — no separate `<link>` tag needed. Pass `data-inject-styles="false"` to opt out and load `dist/modal.css` or `dist/bar.css` yourself.

> **CSP note:** Style injection requires `style-src 'unsafe-inline'` in your Content Security Policy. If your CSP blocks inline styles, pass `data-inject-styles="false"` (or `injectStyles: false` in `createModal()`) and load the stylesheet manually via `<link>` instead.

### npm

```bash
npm install @inputbuffer/feedback
```

Import only what you use — your bundler will tree-shake the rest:

```js
// Modal only (~16 KB minified)
import { createModal } from '@inputbuffer/feedback/modal';

// Bar only (~18 KB minified)
import { createBar } from '@inputbuffer/feedback/bar';

// Full bundle
import { InputBufferIO } from '@inputbuffer/feedback';
```

TypeScript types are included and exported from each entry point.

### Browser support

Chrome 111+, Firefox 113+, Safari 16.2+. The bundles target ES2019 and rely on Custom Elements v1 (used by the `<inputbuffer-feedback>` web component).

---

## Authentication

InputBuffer issues two kinds of token, and this widget needs the browser-safe one.

| Token | Prefix | Where it belongs |
|---|---|---|
| Widget | `ibw_` | **Use this.** Safe to embed in a public page. Scoped to submitting feedback and reactions, nothing else. |
| Full access | `ib_` | Server-side only. Rejected with `403 widget-token-restricted` when sent from a browser. |

Create a widget token in **Settings → API Tokens** with the Widget scope, then add the origins your widget is embedded on to the token's allowlist. A request from an origin that isn't allowlisted is rejected with `403 forbidden-origin`.

Because the token is public, it can only create feedback and reactions — it cannot read your existing feedback, browse buffers, or touch anything else in your organization.

> **Privacy:** feedback text is sent to third-party AI services for classification and search, and is not scrubbed first. Don't prompt users for personal information, credentials, or production secrets.

The full API this widget speaks to is documented at [inputbuffer.io/docs/api](https://inputbuffer.io/docs/api/getting-started), with the machine-readable spec at [openapi.yaml](https://inputbuffer.io/docs/api/openapi.yaml).

---

## Reference

Each CDN bundle sets `window.InputBufferIO` at parse time — no `DOMContentLoaded` needed. What's exposed depends on which bundle you load:

| Bundle | `window.InputBufferIO` |
|---|---|
| `widget.js` | `{ createModal, createBar, version }` |
| `modal.js` | `{ createModal, version }` |
| `bar.js` | `{ createBar, version }` |

When using npm imports, use the named exports directly (`createModal`, `createBar`) rather than the global.

---

## Feedback bar

The feedback bar is an inline or fixed thumbs up/down component — a lightweight alternative to the modal. It can be used as a web component or created programmatically.

### Web component

```html
<script src="https://cdn.jsdelivr.net/npm/@inputbuffer/feedback/dist/bar.js"></script>

<inputbuffer-feedback api-key="YOUR_WIDGET_TOKEN" label="Was this helpful?"></inputbuffer-feedback>
```

Supported attributes:

| Attribute | Description |
|---|---|
| `api-key` | **Required.** Your widget token (`ibw_…`). |
| `api-url` | Override the API base origin (e.g. `http://localhost:8080`). Paths are appended by the widget. |
| `label` | Text shown next to the thumbs. |
| `placement` | `"inline"` (default) or `"fixed"` (pins to bottom of viewport). |
| `theme-primary` | Primary color. |
| `theme-background` | Background color. |
| `theme-text` | Text color. |
| `theme-selected` | Background color of the selected thumb. |
| `theme-selected-color` | Icon color of the selected thumb. |
| `inject-styles` | Set to `"false"` to skip automatic style injection. |
| `color-scheme` | `"light"`, `"dark"`, or `"auto"`. |
| `show-label` | `"true"` to show the label, `"false"` to hide it. |
| `show-thumbs` | `"true"` to show the thumbs (default), `"false"` to hide them and turn the whole bar into one button that opens the form. Ignores `show-label="false"`. |
| `modal-title` | Title shown above the feedback textarea. |
| `modal-placeholder` | Placeholder text for the feedback textarea. |
| `show-title-field` | `"true"` to show an optional title input. |
| `submitted-by` | Opaque identifier for whoever is submitting, e.g. your own user id. Sent as `submitted_by`. |
| `user-id` | Stable user identifier for reaction deduplication. When set, only one reaction per user is recorded per target (all-time). When omitted, deduplication falls back to IP address with a 24-hour window. |
| `target-*` | Attaches the bar to a specific docs page, endpoint, or command. See [Target attributes](#target-attributes). |

Attach a target to record thumb votes against it:

```html
<inputbuffer-feedback
  api-key="ibw_YOUR_WIDGET_TOKEN"
  label="Was this helpful?"
  target-type="documentation">
</inputbuffer-feedback>
```

Without a target, a thumb click still opens the follow-up form, but there is nothing for the reactions API to count the vote against.

### `InputBufferIO.createBar(config)`

Creates a feedback bar programmatically and returns a `FeedbackBarInstance` with an `element` property (mount it yourself) and a `destroy()` method.

```js
const bar = InputBufferIO.createBar({
    apiKey: 'YOUR_WIDGET_TOKEN',
    label: 'Was this helpful?',
});
document.getElementById('my-slot').appendChild(bar.element);
```

| Property | Type | Default | Description |
|---|---|---|---|
| `apiKey` | string | — | **Required.** Your widget token (`ibw_…`). |
| `apiUrl` | string | `'https://inputbuffer.io'` | API base origin. Paths are appended by the widget. |
| `label` | string | — | Text shown next to the thumbs. |
| `showLabel` | boolean | `true` | Set to `false` to show thumbs only. Ignored when `showThumbs` is `false`. |
| `showThumbs` | boolean | `true` | Set to `false` to hide the thumbs. The whole bar becomes one button that opens the form with no sentiment, and no reaction is recorded. |
| `placement` | `'inline'` \| `'fixed'` | `'inline'` | `fixed` pins the bar to the bottom of the viewport. |
| `colorScheme` | `'light'` \| `'dark'` \| `'auto'` | `'auto'` | Force a color scheme or follow the system setting. |
| `theme.primary` | string | — | Primary color (buttons, focus rings). |
| `theme.background` | string | — | Bar and popover background color. |
| `theme.surface` | string | — | Popover header surface color. |
| `theme.text` | string | — | Text color. |
| `theme.selected` | string | — | Background color of the selected thumb. |
| `theme.selectedColor` | string | — | Icon color of the selected thumb. |
| `target.type` | `'documentation'` \| `'rest_endpoint'` \| `'cli_command'` | — | The kind of thing the user is giving feedback on. Required to record thumb votes. |
| `target.metadata` | object | — | **Required** when `target` is set. Type-specific fields — see [Target metadata schemas](#target-metadata-schemas). |
| `modalTitle` | string | — | Heading for the follow-up popover. |
| `modalPlaceholder` | string | — | Textarea placeholder for the follow-up popover. |
| `showTitleField` | boolean | `false` | Show/hide the title field in the follow-up popover. |
| `submittedBy` | string | — | Opaque identifier for whoever is submitting, e.g. your own user id or an anonymous token. Sent as `submitted_by` (max 300 chars). |
| `userId` | string | — | Stable user identifier for reaction deduplication. When set, only one reaction per user is recorded per target (all-time). When omitted, deduplication falls back to IP address with a 24-hour window. |
| `injectStyles` | boolean | `true` | Set to `false` to skip automatic style injection. |

### `bar.on(event, handler)`

Subscribes to bar lifecycle events.

```js
bar.on('vote',   ({ sentiment }) => console.log('Voted:', sentiment));
bar.on('open',   ({ sentiment }) => console.log('Popover opened after:', sentiment));
bar.on('submit', ({ id })        => console.log('Feedback ID:', id));
bar.on('close',  ()              => console.log('Popover closed'));
bar.on('error',  (err)           => console.error('Submission failed:', err));
```

| Event | Handler signature | When it fires |
|---|---|---|
| `vote` | `({ sentiment: 'positive' \| 'negative' }) => void` | User clicks a thumb. If a `target` is configured, the reaction is recorded immediately via `POST /api/v0/reactions` (fire-and-forget — a failure never blocks the follow-up form). The selection is persisted in `localStorage` for 24 hours so it survives page reloads. |
| `open` | `({ sentiment?: 'positive' \| 'negative' }) => void` | The follow-up popover opens. `sentiment` is absent when it was opened by the label trigger (`showThumbs: false`) or by a bare `open()`. |
| `submit` | `({ id: string }) => void` | Feedback was submitted successfully. |
| `close` | `() => void` | The follow-up popover closes. |
| `error` | `(err: Error) => void` | The submission request failed. |

### `bar.open(sentiment?)`

Opens the follow-up form from your own UI. Pass `'positive'` or `'negative'` to select that thumb;
omit the argument to keep whatever is already selected.

```js
bar.open();            // no sentiment (or the current one, if a thumb is selected)
bar.open('negative');  // selects the thumbs-down
```

This is a display action only — unlike a real thumb click it does **not** record a reaction, write to
`localStorage`, or emit `vote`. Use it to drive the bar from a custom trigger, for example alongside
`showThumbs: false`.

### `bar.close()`

Closes the follow-up form. A no-op when it is already closed (no `close` event is emitted).

### `bar.destroy()`

Removes the bar element and all event listeners.

---

## Feedback modal

The feedback modal is a full-text input form triggered by a button click. It can be opened programmatically or auto-initialized from the script tag.

### Script tag attributes (auto-init)

When `data-api-key` is present on the script tag, the widget initializes automatically. All config is read from `data-*` attributes.

| Attribute | Type | Description |
|---|---|---|
| `data-api-key` | string | **Required.** Your widget token (`ibw_…`). |
| `data-api-url` | string | Override the API base origin (useful for local dev/testing). |
| `data-attach-to` | string | CSS selector for the element that opens the modal on click. |
| `data-inject-styles` | boolean | Set to `"false"` to skip automatic style injection. |
| `data-color-scheme` | string | `"light"`, `"dark"`, or `"auto"`. |
| `data-title` | string | Modal heading. |
| `data-placeholder` | string | Textarea placeholder text. |
| `data-show-title-field` | boolean | `"true"` to show an optional title field. |
| `data-show-sentiment` | boolean | `"true"` to show thumbs up/down buttons in the modal. |
| `data-submitted-by` | string | Opaque identifier for whoever is submitting. Sent as `submitted_by`. |
| `data-theme-primary` | string | Primary color (buttons, focus rings). Any CSS color value. |
| `data-theme-background` | string | Modal background color. |
| `data-theme-text` | string | Modal text color. |
| `data-theme-selected` | string | Background color of the selected sentiment thumb. |
| `data-theme-selected-color` | string | Icon color of the selected sentiment thumb. |

> **Note:** `theme.surface` is only available via the programmatic API (`createModal(config)`), not as a `data-*` attribute.

### `InputBufferIO.createModal(config)`

Creates a widget instance programmatically. Returns a `WidgetInstance`.

```js
const ib = InputBufferIO.createModal({
    apiKey: 'YOUR_WIDGET_TOKEN',
});
```

| Property | Type | Default | Description |
|---|---|---|---|
| `apiKey` | string | — | **Required.** Your widget token (`ibw_…`). |
| `apiUrl` | string | `'https://inputbuffer.io'` | API base origin (useful for local dev/testing). Paths are appended by the widget. |
| `attachTo` | string | — | CSS selector. Clicking the matched element calls `open()`. |
| `injectStyles` | boolean | `true` | Set to `false` to skip automatic style injection. |
| `title` | string | — | Modal heading. Omit to render no title. |
| `placeholder` | string | `"What's on your mind?"` | Textarea placeholder text. |
| `showTitleField` | boolean | `false` | Set to `true` to show an optional title field. |
| `showSentiment` | boolean | `false` | Show thumbs up/down sentiment buttons in the modal. |
| `submittedBy` | string | — | Opaque identifier for whoever is submitting, e.g. your own user id or an anonymous token. Sent as `submitted_by` (max 300 chars). |
| `colorScheme` | `'light'` \| `'dark'` \| `'auto'` | `'auto'` | Force a color scheme or follow the system setting. |
| `theme.primary` | string | — | Primary color (buttons, focus rings). |
| `theme.background` | string | — | Modal background color. |
| `theme.surface` | string | — | Modal header surface color. |
| `theme.text` | string | — | Modal text color. |
| `theme.selected` | string | — | Background color of the selected sentiment thumb. |
| `theme.selectedColor` | string | — | Icon color of the selected sentiment thumb. |

### `instance.open(options?)`

Opens the feedback modal. Pass options to provide context at call time — useful when the same widget instance is reused across different pages or sections.

```js
ib.open({
    title: 'Was this helpful?',
    target: {
        type: 'documentation',
        metadata: {
            page_url: window.location.href,
            section_heading: 'Authentication',
        },
    },
    prefill: {
        description: '👍 This page was helpful',
    },
});
```

| Property | Type | Description |
|---|---|---|
| `title` | string | Overrides the modal heading for this open call. |
| `sentiment` | `'positive'` \| `'negative'` | Pre-selects a sentiment thumb. Only relevant when `showSentiment` is enabled. Drives the UI only — the feedback API has no sentiment field. |
| `target.type` | `'documentation'` \| `'rest_endpoint'` \| `'cli_command'` | The kind of thing the user is giving feedback on. |
| `target.metadata` | object | **Required** when `target` is set. Type-specific fields — see [Target metadata schemas](#target-metadata-schemas). |
| `prefill.description` | string | Pre-populates the textarea. |
| `submittedBy` | string | Overrides the `submittedBy` set in `createModal(config)` for this open call. |

### `instance.close()`

Closes the modal programmatically.

### `instance.destroy()`

Closes the modal and removes all event listeners and DOM elements. The instance cannot be reused after this call — invoke `createModal()` again to get a fresh one. You may have multiple `WidgetInstance`s on a page, but opening more than one modal simultaneously is not supported (they share DOM IDs).

### `instance.on(event, handler)`

Subscribes to widget lifecycle events.

```js
ib.on('submit', (result) => console.log('Feedback ID:', result.id));
ib.on('close',  ()       => console.log('Modal closed'));
ib.on('error',  (err)    => console.error('Submission failed:', err));
```

| Event | Handler signature | When it fires |
|---|---|---|
| `submit` | `(result: { id: string }) => void` | Feedback was submitted successfully. `result.id` is the InputBuffer feedback ID. |
| `close` | `() => void` | The modal was closed, either by the user or programmatically. |
| `error` | `(err: Error) => void` | The submission request failed. |

### `InputBufferIO.version`

The currently loaded widget version string.

```js
console.log(InputBufferIO.version); // e.g. "0.3.0"
```

---

## Targets

A target is the thing feedback is *about* — a docs page, an API endpoint, a CLI command. Two targets of the same type with the same metadata are the same target, which is how InputBuffer groups feedback and counts reactions. You don't register targets ahead of time: send the type and metadata, and the API resolves an existing target or creates one.

Targets are also what make the thumbs bar's votes countable. Without a target, a thumb click opens the follow-up form but records no reaction.

### Target metadata schemas

`metadata` is required whenever you set a target, and the fields it accepts depend on `target.type`. The server rejects a target that is missing a required field with a `422`.

**`documentation`**

| Field | Required | Description |
|---|---|---|
| `page_url` | **Yes** | URL of the documentation page. |
| `section_heading` | No | Heading of the section the user is viewing. |
| `doc_version` | No | Documentation version string. |

**`rest_endpoint`**

| Field | Required | Description |
|---|---|---|
| `method` | **Yes** | HTTP method (`GET`, `POST`, etc.). |
| `path` | **Yes** | API path (e.g. `/users/{id}`). |
| `host` | No | Hostname (e.g. `api.example.com`). |
| `api_version` | No | API version string. |

**`cli_command`**

| Field | Required | Description |
|---|---|---|
| `command` | **Yes** | Top-level CLI command (e.g. `deploy`). |
| `subcommand` | No | Subcommand, which may be multi-word (e.g. `container run`). |
| `cli_version` | No | CLI version string. |
| `args` | No | Documented flags and args, e.g. `['--rm', '--network']`. When feedback is submitted with more than one, each flag becomes its own target. |

### Target attributes

The `<inputbuffer-feedback>` element builds a target from `target-type` plus the metadata attributes for that type:

| Attribute | Applies to | Maps to |
|---|---|---|
| `target-type` | all | `type` — `documentation`, `rest_endpoint`, or `cli_command` |
| `target-page-url` | `documentation` | `page_url` — defaults to the current page URL |
| `target-section-heading` | `documentation` | `section_heading` |
| `target-doc-version` | `documentation` | `doc_version` |
| `target-method` | `rest_endpoint` | `method` |
| `target-path` | `rest_endpoint` | `path` |
| `target-host` | `rest_endpoint` | `host` |
| `target-api-version` | `rest_endpoint` | `api_version` |
| `target-command` | `cli_command` | `command` |
| `target-subcommand` | `cli_command` | `subcommand` |
| `target-cli-version` | `cli_command` | `cli_version` |
| `target-args` | `cli_command` | `args` — comma-separated |

Because `target-page-url` defaults to `window.location.href`, rating the current docs page needs one attribute:

```html
<inputbuffer-feedback api-key="ibw_YOUR_WIDGET_TOKEN" target-type="documentation"></inputbuffer-feedback>
```

An endpoint reference needs its identifying fields spelled out:

```html
<inputbuffer-feedback
  api-key="ibw_YOUR_WIDGET_TOKEN"
  target-type="rest_endpoint"
  target-method="POST"
  target-path="/v1/uploads">
</inputbuffer-feedback>
```

If a required attribute is missing the widget logs a warning and drops the target rather than sending a request the server would reject.

---

## Errors

API errors arrive as [RFC 7807 Problem Details](https://inputbuffer.io/docs/api/problems). The `error` event hands you an `ApiError` with `type`, `title`, `status`, `detail`, `category`, and (on validation failures) `field`. Switch on `type` rather than `status` — several types share a status code.

`category` decides what the user sees:

- **`user`** — they sent something the API rejected. `detail` is written for them and is shown in the form as-is.
- **`integration`** — your embed is misconfigured. The user sees a generic message, and the widget logs the real reason to the browser console.

| Problem type | Status | What went wrong |
|---|---|---|
| `unauthorized`, `invalid-token`, `invalid-token-format` | 401 | The token is missing, malformed, or revoked. |
| `widget-token-restricted` | 403 | A full-access `ib_…` token was used from a browser. Use a widget `ibw_…` token. |
| `forbidden-origin` | 403 | This page's origin isn't on the token's allowlist. |
| `usage-limit-reached` | 402 | The organization hit its lifetime feedback limit. |
| `missing-required-field`, `invalid-field-value` | 422 | A field is missing or invalid; `field` names it. |
| `rate-limited` | 429 | Too many requests. |
| `internal-error` | 500 | Something failed on InputBuffer's end. |

`ApiError` is exported from every entry point, so you can narrow with `instanceof`:

```js
import { ApiError } from '@inputbuffer/feedback/modal';

ib.on('error', (err) => {
    if (err instanceof ApiError && err.category === 'integration') {
        console.error('Fix your embed:', err.type, err.detail);
    }
});
```

Network failures and the 10-second request timeout surface as ordinary `Error`s, not `ApiError`s.

---

## CSS customization

Each component uses stable selectors you can target directly in your stylesheet.

### Modal selectors

| Selector | Class alias | Element |
|---|---|---|
| `#ib-overlay` | — | Full-screen backdrop |
| `#ib-modal` | — | Modal container (scopes all CSS variables) |
| `#ib-modal-header` | — | Header bar |
| `#ib-modal-body` | — | Body area |
| `#ib-title` | `.ib-modal-title` | Modal heading |
| `#ib-textarea` | `.ib-modal-textarea` | Feedback text field |
| `#ib-title-input` | `.ib-modal-title-input` | Optional title input |
| `#ib-submit` | `.ib-modal-submit` | Submit button |
| `#ib-close` | `.ib-modal-close` | Close button |
| `#ib-success` | `.ib-modal-success` | Success message |
| `#ib-error` | `.ib-modal-error` | Error message |

The IDs are the stable public API and will not change between releases. The `.ib-modal-*` class aliases are equivalent and exist for symmetry with the bar.

### Bar selectors

| Class | Element |
|---|---|
| `.ib-bar-wrapper` | Outer wrapper (scopes all CSS variables) |
| `.ib-bar` | The visible bar strip |
| `.ib-bar-label-area` | Label container; a `<button>` when `showThumbs` is `false` |
| `.ib-bar-label-area--trigger` | Added to the label container when it is the button that opens the form |
| `.ib-bar-label` | Label text |
| `.ib-bar-actions` | Thumb button group; absent when `showThumbs` is `false` |
| `.ib-bar-actions--no-label` | Added to the thumb group when `showLabel` is `false` |
| `.ib-bar-btn` | Thumb buttons |
| `.ib-bar-popover` | Follow-up popover container |
| `.ib-bar-header` | Popover header |
| `.ib-bar-body` | Popover body |
| `.ib-bar-title` | Popover heading |
| `.ib-bar-textarea` | Feedback text field |
| `.ib-bar-title-input` | Optional title input |
| `.ib-bar-submit` | Submit button |
| `.ib-bar-success` | Success message |
| `.ib-bar-error` | Error message |

### CSS custom properties

Both components expose the same set of CSS custom properties. Set them on `#ib-modal` or `.ib-bar-wrapper` respectively, or pass them via the `theme` config option.

| Property | Default (light) | Default (dark) | What it affects |
|---|---|---|---|
| `--ib-primary` | `#6366f1` | `#3A5244` | Buttons, focus rings, borders |
| `--ib-primary-hover` | `#4338ca` | `#4E6857` | Button hover state |
| `--ib-background` | `#f6f6f8` | `#25272B` | Form area background |
| `--ib-surface` | `#ffffff` | `#2C3630` | Header/card background |
| `--ib-text` | `#111827` | `#E5E7EB` | Body text |
| `--ib-muted` | `#8d99ae` | `#9CA3AF` | Label and hint text |
| `--ib-border` | `(primary)` | `#363840` | Border color |
| `--ib-selected` | `(primary)` | `(primary)` | Selected thumb background |
| `--ib-selected-color` | `(surface)` | `(surface)` | Selected thumb icon color |
| `--ib-radius` | `2px` | `8px` | Container border radius |
| `--ib-radius-input` | `2px` | `4px` | Input/button border radius |

---

## Common tasks

### Attach feedback to a specific docs page

```js
// <script src="https://cdn.jsdelivr.net/npm/@inputbuffer/feedback/dist/modal.js" data-api-key="YOUR_WIDGET_TOKEN"></script>
const ib = InputBufferIO.createModal({ apiKey: 'YOUR_WIDGET_TOKEN' });

document.getElementById('feedback-btn').addEventListener('click', () => {
    ib.open({
        title: 'Was this page helpful?',
        target: {
            type: 'documentation',
            metadata: {
                page_url: window.location.href,
                section_heading: document.querySelector('h1')?.textContent ?? '',
            },
        },
    });
});
```

### Attach feedback to a REST endpoint reference

```js
// <script src="https://cdn.jsdelivr.net/npm/@inputbuffer/feedback/dist/modal.js" data-api-key="YOUR_WIDGET_TOKEN"></script>
const ib = InputBufferIO.createModal({ apiKey: 'YOUR_WIDGET_TOKEN' });

ib.open({
    target: {
        type: 'rest_endpoint',
        metadata: { method: 'POST', path: '/v1/uploads' },
    },
});
```

### Attach feedback to a CLI command reference

```js
// <script src="https://cdn.jsdelivr.net/npm/@inputbuffer/feedback/dist/modal.js" data-api-key="YOUR_WIDGET_TOKEN"></script>
const ib = InputBufferIO.createModal({ apiKey: 'YOUR_WIDGET_TOKEN' });

ib.open({
    target: {
        type: 'cli_command',
        metadata: { command: 'deploy' },
    },
});
```

### Listen for submissions

```js
// <script src="https://cdn.jsdelivr.net/npm/@inputbuffer/feedback/dist/modal.js" data-api-key="YOUR_WIDGET_TOKEN"></script>
const ib = InputBufferIO.createModal({ apiKey: 'YOUR_WIDGET_TOKEN' });

ib.on('submit', ({ id }) => {
    analytics.track('feedback_submitted', { feedbackId: id });
});

ib.on('error', (err) => {
    console.error('Feedback submission failed:', err.message);
});
```

### Force a dark theme

```js
// <script src="https://cdn.jsdelivr.net/npm/@inputbuffer/feedback/dist/modal.js" data-api-key="YOUR_WIDGET_TOKEN"></script>
InputBufferIO.createModal({
    apiKey: 'YOUR_WIDGET_TOKEN',
    colorScheme: 'dark',
    theme: {
        primary: '#818cf8',
        background: '#1e1e2e',
        text: '#cdd6f4',
    },
}).open();
```

### Add a thumbs bar to a docs page

```html
<script src="https://cdn.jsdelivr.net/npm/@inputbuffer/feedback/dist/bar.js"></script>

<inputbuffer-feedback api-key="YOUR_WIDGET_TOKEN" label="Was this helpful?"></inputbuffer-feedback>
```

### Load only the bar via npm

```js
import { createBar } from '@inputbuffer/feedback/bar';

const bar = createBar({ apiKey: 'YOUR_WIDGET_TOKEN', label: 'Was this helpful?' });
document.getElementById('my-slot').appendChild(bar.element);
```

### Load your own CSS instead of the injected styles

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@inputbuffer/feedback/dist/modal.css">

<script src="https://cdn.jsdelivr.net/npm/@inputbuffer/feedback/dist/modal.js"
    data-api-key="YOUR_WIDGET_TOKEN"
    data-inject-styles="false">
</script>
```

### Identify who submitted feedback

`submittedBy` is an opaque string — your own user id, or an anonymous token. It's stored exactly as sent and never parsed, so prefer an id over an email address.

```js
InputBufferIO.createBar({
    apiKey: 'ibw_YOUR_WIDGET_TOKEN',
    target: { type: 'documentation', metadata: { page_url: window.location.href } },
    submittedBy: currentUser.id,  // attached to submitted feedback
    userId: currentUser.id,       // deduplicates thumb votes
});
```

`submittedBy` and `userId` do different jobs and can hold the same value. `submittedBy` records who wrote a piece of feedback; `userId` holds each person to one reaction per target for all time. Without `userId`, reactions fall back to one per target per IP address every 24 hours, which is best-effort — people behind a shared network can overwrite each other.

### Point the widget at a local API

```js
InputBufferIO.createModal({
    apiKey: 'ibw_YOUR_WIDGET_TOKEN',
    apiUrl: 'http://localhost:8080',
});
```

`apiUrl` is a base origin, not an endpoint. The widget appends `/api/v0/feedback` and `/api/v0/reactions` itself.

---

## License

MIT
