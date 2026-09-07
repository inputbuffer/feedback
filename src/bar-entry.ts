import type { FeedbackBarConfig, FeedbackBarInstance } from './types.js';
import { createFeedbackBar } from './bar.js';
import { WIDGET_VERSION } from './api.js';
import { barConfigFromElement, shouldInjectStyles } from './attrs.js';
import cssText from './bar.css';

function injectStyles(): void {
    if (typeof document === 'undefined') return;
    if (document.getElementById('ib-bar-styles')) return;
    const style = document.createElement('style');
    style.id = 'ib-bar-styles';
    style.textContent = cssText;
    document.head.appendChild(style);
}

function createBar(config: FeedbackBarConfig): FeedbackBarInstance {
    if (config.injectStyles !== false) injectStyles();
    return createFeedbackBar(config);
}

class InputBufferIOFeedbackElement extends HTMLElement {
    private _bar: FeedbackBarInstance | null = null;

    connectedCallback() {
        const apiKey = this.getAttribute('api-key');
        if (!apiKey) return;

        if (shouldInjectStyles(this)) injectStyles();

        this._bar = createFeedbackBar(barConfigFromElement(this, apiKey));
        this.appendChild(this._bar.element);
    }

    disconnectedCallback() {
        this._bar?.destroy();
        this._bar = null;
    }
}

if (typeof customElements !== 'undefined' && !customElements.get('inputbuffer-feedback')) {
    customElements.define('inputbuffer-feedback', InputBufferIOFeedbackElement);
}

// Expose on window
const InputBufferIO = { createBar, version: WIDGET_VERSION };
if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>)['InputBufferIO'] = InputBufferIO;
}

export type { FeedbackBarConfig, FeedbackBarInstance };
export type {
    TargetSpec, RestEndpointTarget, DocumentationTarget, CliCommandTarget,
    TargetRef, ReactionResult, ProblemDetails, ProblemType,
} from './types.js';
// A class, so it is exported as a value: consumers need `err instanceof ApiError`.
export { ApiError } from './types.js';
export { InputBufferIO, createBar };
