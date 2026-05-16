import type { WidgetConfig, OpenOptions, WidgetInstance, FeedbackBarConfig, FeedbackBarInstance } from './types.js';
import { createModal as createModalInstance } from './modal.js';
import { createFeedbackBar } from './bar.js';
import { WIDGET_VERSION } from './api.js';
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

            const injectStylesAttr = this.getAttribute('inject-styles');
            const shouldInject = injectStylesAttr === null ? true : injectStylesAttr !== 'false';
            if (shouldInject) injectBarStyles();

            const placement = this.getAttribute('placement');
            const showLabelAttr = this.getAttribute('show-label');
            const showTitleFieldAttr = this.getAttribute('show-title-field');
            const showEmailFieldAttr = this.getAttribute('show-email-field');
            this._bar = createFeedbackBar({
                apiKey,
                apiUrl: this.getAttribute('api-url') ?? undefined,
                label: this.getAttribute('label') ?? undefined,
                placement: placement === 'fixed' ? 'fixed' : 'inline',
                colorScheme: (this.getAttribute('color-scheme') as FeedbackBarConfig['colorScheme']) ?? undefined,
                showLabel: showLabelAttr === null ? undefined : showLabelAttr === 'true',
                modalTitle: this.getAttribute('modal-title') ?? undefined,
                modalPlaceholder: this.getAttribute('modal-placeholder') ?? undefined,
                showTitleField: showTitleFieldAttr === null ? undefined : showTitleFieldAttr === 'true',
                showEmailField: showEmailFieldAttr === null ? undefined : showEmailFieldAttr === 'true',
                source: this.getAttribute('source') ?? undefined,
                userId: this.getAttribute('user-id') ?? undefined,
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
}

// Expose on window
const InputBufferIO = { createModal, createBar, version: WIDGET_VERSION };
if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>)['InputBufferIO'] = InputBufferIO;
}

// Auto-init when data-api-key is present on the script tag
(function autoInit() {
    if (typeof window === 'undefined') return;
    const apiKey = _currentScript?.dataset.apiKey;
    if (!apiKey) return;

    const injectStyles = _currentScript?.dataset.injectStyles;
    const colorScheme = _currentScript?.dataset.colorScheme as WidgetConfig['colorScheme'] | undefined;
    const instance = createModal({
        apiKey,
        apiUrl: _currentScript?.dataset.apiUrl,
        attachTo: _currentScript?.dataset.attachTo,
        injectStyles: injectStyles === undefined ? true : injectStyles !== 'false',
        colorScheme,
        theme: {
            primary: _currentScript?.dataset.themePrimary,
            background: _currentScript?.dataset.themeBackground,
            text: _currentScript?.dataset.themeText,
            selected: _currentScript?.dataset.themeSelected,
            selectedColor: _currentScript?.dataset.themeSelectedColor,
        },
    });

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
export { InputBufferIO };
