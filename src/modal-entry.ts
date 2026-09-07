import type { WidgetConfig, OpenOptions, WidgetInstance } from './types.js';
import { createModal as createModalInstance } from './modal.js';
import { WIDGET_VERSION } from './api.js';
import { modalConfigFromScript } from './attrs.js';
import cssText from './modal.css';

// Capture currentScript synchronously — only valid at script load time.
const _currentScript = document.currentScript as HTMLScriptElement | null;

function injectStyles(): void {
    if (document.getElementById('ib-modal-styles')) return;
    const style = document.createElement('style');
    style.id = 'ib-modal-styles';
    style.textContent = cssText;
    document.head.appendChild(style);
}

function createModal(config: WidgetConfig): WidgetInstance {
    if (config.injectStyles !== false) injectStyles();
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
        open:    (options?) => instance.open(options),
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

// Expose on window
const InputBufferIO = { createModal, version: WIDGET_VERSION };
(window as unknown as Record<string, unknown>)['InputBufferIO'] = InputBufferIO;

// Auto-init when data-api-key is present on the script tag
(function autoInit() {
    if (!_currentScript) return;
    const apiKey = _currentScript.dataset.apiKey;
    if (!apiKey) return;

    const instance = createModal(modalConfigFromScript(_currentScript, apiKey));

    (InputBufferIO as Record<string, unknown>)['_defaultInstance'] = instance;
})();

export type { WidgetConfig, OpenOptions, WidgetInstance };
export type {
    TargetSpec, RestEndpointTarget, DocumentationTarget, CliCommandTarget,
    ProblemDetails, ProblemType,
} from './types.js';
// A class, so it is exported as a value: consumers need `err instanceof ApiError`.
export { ApiError } from './types.js';
export { InputBufferIO, createModal };
