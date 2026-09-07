import type { WidgetConfig, OpenOptions, WidgetInstance, FeedbackBarConfig, FeedbackBarInstance } from './types.js';
import { createModal as createModalInstance } from './modal.js';
import { createFeedbackBar } from './bar.js';
import { WIDGET_VERSION } from './api.js';
import { barConfigFromElement, modalConfigFromScript, shouldInjectStyles } from './attrs.js';
import modalCssText from './modal.css';
import barCssText from './bar.css';

// Capture currentScript synchronously — only valid at script load time.
// Guard required for SSR environments where document is not defined.
const _currentScript = typeof document !== 'undefined'
    ? document.currentScript as HTMLScriptElement | null
    : null;

function injectModalStyles(): void {
    if (typeof document === 'undefined') return;
    if (document.getElementById('ib-modal-styles')) return;
    const style = document.createElement('style');
    style.id = 'ib-modal-styles';
    style.textContent = modalCssText;
    document.head.appendChild(style);
}

function injectBarStyles(): void {
    if (typeof document === 'undefined') return;
    if (document.getElementById('ib-bar-styles')) return;
    const style = document.createElement('style');
    style.id = 'ib-bar-styles';
    style.textContent = barCssText;
    document.head.appendChild(style);
}

function createModal(config: WidgetConfig): WidgetInstance {
    if (config.injectStyles !== false) injectModalStyles();
    const instance = createModalInstance(config);

    let attachEl: Element | null = null;
    let attachListener: (() => void) | null = null;

    if (config.attachTo) {
        attachEl = document.querySelector(config.attachTo);
        if (attachEl) {
            attachListener = () => instance.open();
            attachEl.addEventListener('click', attachListener);
        }
    }

    return {
        open:    (options?: OpenOptions) => instance.open(options),
        close:   () => instance.close(),
        on:      (event, handler) => instance.on(event, handler),
        destroy: () => {
            if (attachEl && attachListener) {
                attachEl.removeEventListener('click', attachListener);
                attachEl = null;
                attachListener = null;
            }
            instance.destroy();
        },
    };
}

function createBar(config: FeedbackBarConfig): FeedbackBarInstance {
    if (config.injectStyles !== false) injectBarStyles();
    return createFeedbackBar(config);
}

if (typeof HTMLElement !== 'undefined') {
    class InputBufferIOFeedbackElement extends HTMLElement {
        private _bar: FeedbackBarInstance | null = null;

        connectedCallback() {
            const apiKey = this.getAttribute('api-key');
            if (!apiKey) return;

            if (shouldInjectStyles(this)) injectBarStyles();

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
}

// Expose on window
const InputBufferIO = { createModal, createBar, version: WIDGET_VERSION };
if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>)['InputBufferIO'] = InputBufferIO;
}

// Auto-init when data-api-key is present on the script tag
(function autoInit() {
    if (typeof window === 'undefined') return;
    if (!_currentScript) return;
    const apiKey = _currentScript.dataset.apiKey;
    if (!apiKey) return;

    const instance = createModal(modalConfigFromScript(_currentScript, apiKey));

    (InputBufferIO as Record<string, unknown>)['_defaultInstance'] = instance;
})();

declare global {
    interface Window {
        InputBufferIO: typeof InputBufferIO;
    }
    interface HTMLElementTagNameMap {
        'inputbuffer-feedback': HTMLElement;
    }
}

export type { WidgetConfig, OpenOptions, WidgetInstance, FeedbackBarConfig, FeedbackBarInstance };
export type {
    TargetSpec, RestEndpointTarget, DocumentationTarget, CliCommandTarget,
    TargetRef, ReactionResult, ProblemDetails, ProblemType,
} from './types.js';
// A class, so it is exported as a value: consumers need `err instanceof ApiError`.
export { ApiError } from './types.js';
export { InputBufferIO };
