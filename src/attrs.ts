import type { FeedbackBarConfig, TargetSpec, WidgetConfig } from './types.js';
import { warn } from './errors.js';

/**
 * Attribute parsing for the declarative entry points: the `<inputbuffer-feedback>` element and
 * script-tag auto-init. It lives here rather than in each entry point because `index.ts`,
 * `bar-entry.ts`, and `modal-entry.ts` each ship their own copy of the element or the auto-init
 * block, and reading the attributes in three places is how the bundles drifted apart.
 */

function optional(el: Element, name: string): string | undefined {
    return el.getAttribute(name) ?? undefined;
}

/** Tri-state: absent means "leave the default alone", which is not the same as `false`. */
function optionalBool(el: Element, name: string): boolean | undefined {
    const raw = el.getAttribute(name);
    return raw === null ? undefined : raw === 'true';
}

function themeFromAttributes(el: Element): WidgetConfig['theme'] {
    return {
        primary: optional(el, 'theme-primary'),
        background: optional(el, 'theme-background'),
        text: optional(el, 'theme-text'),
        selected: optional(el, 'theme-selected'),
        selectedColor: optional(el, 'theme-selected-color'),
    };
}

/**
 * Builds a target from `target-type` plus the metadata attributes for that type. The API
 * requires a target's identifying fields, so a target missing one is dropped with a warning
 * rather than sent for the server to reject.
 */
export function targetFromAttributes(el: Element): TargetSpec | undefined {
    const type = el.getAttribute('target-type');
    if (!type) return undefined;

    switch (type) {
        case 'documentation': {
            // The page the widget is embedded on is nearly always the page being rated, so
            // `target-type="documentation"` alone is enough for the common docs-site case.
            const pageUrl = optional(el, 'target-page-url')
                ?? (typeof window !== 'undefined' ? window.location.href : undefined);
            if (!pageUrl) {
                warn('target-type="documentation" needs target-page-url. Ignoring the target.');
                return undefined;
            }
            return {
                type: 'documentation',
                metadata: {
                    page_url: pageUrl,
                    section_heading: optional(el, 'target-section-heading'),
                    doc_version: optional(el, 'target-doc-version'),
                },
            };
        }

        case 'rest_endpoint': {
            const method = optional(el, 'target-method');
            const path = optional(el, 'target-path');
            if (!method || !path) {
                warn('target-type="rest_endpoint" needs target-method and target-path. Ignoring the target.');
                return undefined;
            }
            return {
                type: 'rest_endpoint',
                metadata: {
                    method,
                    path,
                    host: optional(el, 'target-host'),
                    api_version: optional(el, 'target-api-version'),
                },
            };
        }

        case 'cli_command': {
            const command = optional(el, 'target-command');
            if (!command) {
                warn('target-type="cli_command" needs target-command. Ignoring the target.');
                return undefined;
            }
            const args = optional(el, 'target-args');
            return {
                type: 'cli_command',
                metadata: {
                    command,
                    subcommand: optional(el, 'target-subcommand'),
                    cli_version: optional(el, 'target-cli-version'),
                    args: args ? args.split(',').map(a => a.trim()).filter(Boolean) : undefined,
                },
            };
        }

        default:
            warn(`Unknown target-type "${type}". Expected documentation, rest_endpoint, or cli_command.`);
            return undefined;
    }
}

/** Reads a complete bar config off an `<inputbuffer-feedback>` element. */
export function barConfigFromElement(el: Element, apiKey: string): FeedbackBarConfig {
    return {
        apiKey,
        apiUrl: optional(el, 'api-url'),
        label: optional(el, 'label'),
        showLabel: optionalBool(el, 'show-label'),
        showThumbs: optionalBool(el, 'show-thumbs'),
        placement: el.getAttribute('placement') === 'fixed' ? 'fixed' : 'inline',
        colorScheme: optional(el, 'color-scheme') as FeedbackBarConfig['colorScheme'],
        modalTitle: optional(el, 'modal-title'),
        modalPlaceholder: optional(el, 'modal-placeholder'),
        showTitleField: optionalBool(el, 'show-title-field'),
        submittedBy: optional(el, 'submitted-by'),
        userId: optional(el, 'user-id'),
        target: targetFromAttributes(el),
        theme: themeFromAttributes(el),
    };
}

/** True unless `inject-styles="false"` — absent means inject. */
export function shouldInjectStyles(el: Element): boolean {
    return el.getAttribute('inject-styles') !== 'false';
}

/** Reads a modal config off the `data-*` attributes of the loading `<script>` tag. */
export function modalConfigFromScript(script: HTMLScriptElement, apiKey: string): WidgetConfig {
    const d = script.dataset;
    return {
        apiKey,
        apiUrl: d.apiUrl,
        attachTo: d.attachTo,
        injectStyles: d.injectStyles === undefined ? true : d.injectStyles !== 'false',
        colorScheme: d.colorScheme as WidgetConfig['colorScheme'],
        title: d.title,
        placeholder: d.placeholder,
        showTitleField: d.showTitleField === undefined ? undefined : d.showTitleField === 'true',
        showSentiment: d.showSentiment === undefined ? undefined : d.showSentiment === 'true',
        submittedBy: d.submittedBy,
        theme: {
            primary: d.themePrimary,
            background: d.themeBackground,
            text: d.themeText,
            selected: d.themeSelected,
            selectedColor: d.themeSelectedColor,
        },
    };
}
