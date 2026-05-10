import type { FeedbackBarConfig, FeedbackBarInstance } from './types.js';
import { createFeedbackBar } from './bar.js';
import { WIDGET_VERSION } from './api.js';
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

        const injectStylesAttr = this.getAttribute('inject-styles');
        const shouldInject = injectStylesAttr === null ? true : injectStylesAttr !== 'false';
        if (shouldInject) injectStyles();

        const placement = this.getAttribute('placement');
        this._bar = createFeedbackBar({
            apiKey,
            apiUrl: this.getAttribute('api-url') ?? undefined,
            label: this.getAttribute('label') ?? undefined,
            placement: placement === 'fixed' ? 'fixed' : 'inline',
            theme: {
                primary: this.getAttribute('theme-primary') ?? undefined,
                background: this.getAttribute('theme-background') ?? undefined,
                text: this.getAttribute('theme-text') ?? undefined,
                selected: this.getAttribute('theme-selected') ?? undefined,
                selectedColor: this.getAttribute('theme-selected-color') ?? undefined,
            },
        });
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
export { InputBufferIO, createBar };
