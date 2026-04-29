import type { WidgetConfig, OpenOptions } from './types.js';
import { applyTheme } from './theme.js';
import { submitFeedback } from './api.js';

type SubmitHandler = (result: { id: string }) => void;
type CloseHandler = () => void;
type ErrorHandler = (err: Error) => void;

function svgIcon(path: string): SVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '18');
    svg.setAttribute('height', '18');
    svg.setAttribute('fill', 'currentColor');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.display = 'block';
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    el.setAttribute('d', path);
    svg.appendChild(el);
    return svg;
}

// Material Icons outlined paths (Apache 2.0)
const THUMB_UP = 'M9 21h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2zM9 9l4.34-4.34L12 10h9v2l-3 7H9V9zM1 9h2v12H1z';
const THUMB_DOWN = 'M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L10.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm0 12l-4.34 4.34L12 14H3v-2l3-7h9v10zm4-12h2v12h-2z';

export function createModal(config: WidgetConfig) {
    let overlay: HTMLElement | null = null;
    let currentOptions: OpenOptions | undefined;
    let currentSentiment: 'positive' | 'negative' | undefined;
    let autoCloseTimer: ReturnType<typeof setTimeout> | null = null;

    // Closure refs to DOM elements — set by buildDOM, cleared by close
    let textareaEl: HTMLTextAreaElement | null = null;
    let emailInputEl: HTMLInputElement | null = null;
    let submitBtnEl: HTMLButtonElement | null = null;
    let errorEl: HTMLElement | null = null;
    let successEl: HTMLElement | null = null;
    let titleEl: HTMLElement | null = null;

    const submitHandlers: SubmitHandler[] = [];
    const closeHandlers: CloseHandler[] = [];
    const errorHandlers: ErrorHandler[] = [];

    function handleKeydown(e: globalThis.KeyboardEvent) {
        if (e.key === 'Escape') {
            close();
            return;
        }
        if (e.key === 'Tab' && overlay) {
            const focusable = Array.from(
                overlay.querySelectorAll<HTMLElement>(
                    'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
                )
            );
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }
    }

    async function handleSubmit() {
        if (!textareaEl || !submitBtnEl) return;

        const description = textareaEl.value.trim();
        if (description.length < 10) {
            if (errorEl) {
                errorEl.textContent = 'Please enter at least 10 characters.';
                errorEl.style.display = 'block';
            }
            return;
        }

        if (errorEl) errorEl.style.display = 'none';

        submitBtnEl.disabled = true;
        submitBtnEl.textContent = 'Sending…';

        try {
            const email = emailInputEl?.value.trim() || currentOptions?.prefill?.email || null;
            const sentiment = currentSentiment ?? currentOptions?.sentiment;
            const result = await submitFeedback(
                config.apiKey,
                description,
                email || null,
                { ...currentOptions, sentiment },
                config.apiUrl
            );

            if (successEl) {
                successEl.textContent = 'Thanks for your feedback!';
                successEl.style.display = 'block';
            }
            submitHandlers.forEach(h => h(result));
            autoCloseTimer = setTimeout(() => close(), 2000);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error');
            if (errorEl) {
                errorEl.textContent = 'Something went wrong. Please try again.';
                errorEl.style.display = 'block';
            }
            errorHandlers.forEach(h => h(error));
            submitBtnEl.disabled = false;
            submitBtnEl.textContent = 'Send feedback';
        }
    }

    function buildDOM(): HTMLElement {
        const ov = document.createElement('div');
        ov.id = 'ib-overlay';

        const modal = document.createElement('div');
        modal.id = 'ib-modal';
        if (config.colorScheme === 'dark') modal.classList.add('ib-theme-dark');
        else if (config.colorScheme === 'light') modal.classList.add('ib-theme-light');
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'ib-title');

        // Header
        const header = document.createElement('div');
        header.id = 'ib-modal-header';

        titleEl = document.createElement('h2');
        titleEl.id = 'ib-title';
        titleEl.className = 'ib-modal-title';
        titleEl.textContent = config.title || 'Share your feedback';
        header.appendChild(titleEl);

        if (config.showSentiment) {
            let upBtn: HTMLButtonElement;
            let downBtn: HTMLButtonElement;

            const sentiment = document.createElement('div');
            sentiment.className = 'ib-modal-sentiment';

            upBtn = document.createElement('button');
            upBtn.type = 'button';
            upBtn.className = 'ib-modal-thumb ib-modal-thumb--up';
            upBtn.setAttribute('aria-label', 'Helpful');
            upBtn.appendChild(svgIcon(THUMB_UP));

            downBtn = document.createElement('button');
            downBtn.type = 'button';
            downBtn.className = 'ib-modal-thumb ib-modal-thumb--down';
            downBtn.setAttribute('aria-label', 'Not helpful');
            downBtn.appendChild(svgIcon(THUMB_DOWN));

            upBtn.addEventListener('click', () => {
                upBtn.classList.add('ib-modal-thumb--active');
                downBtn.classList.remove('ib-modal-thumb--active');
                currentSentiment = 'positive';
            });
            downBtn.addEventListener('click', () => {
                downBtn.classList.add('ib-modal-thumb--active');
                upBtn.classList.remove('ib-modal-thumb--active');
                currentSentiment = 'negative';
            });

            sentiment.appendChild(upBtn);
            sentiment.appendChild(downBtn);
            header.appendChild(sentiment);
        }

        const closeBtn = document.createElement('button');
        closeBtn.id = 'ib-close';
        closeBtn.className = 'ib-modal-close';
        closeBtn.textContent = '×';
        closeBtn.setAttribute('aria-label', 'Close feedback form');
        closeBtn.addEventListener('click', close);
        header.appendChild(closeBtn);

        // Body
        const body = document.createElement('div');
        body.id = 'ib-modal-body';

        textareaEl = document.createElement('textarea');
        textareaEl.id = 'ib-textarea';
        textareaEl.className = 'ib-modal-textarea';
        textareaEl.placeholder = config.placeholder || 'What\'s on your mind?';
        textareaEl.setAttribute('aria-label', 'Feedback');

        submitBtnEl = document.createElement('button');
        submitBtnEl.id = 'ib-submit';
        submitBtnEl.className = 'ib-modal-submit';
        submitBtnEl.textContent = 'Send feedback';
        submitBtnEl.addEventListener('click', handleSubmit);

        successEl = document.createElement('p');
        successEl.id = 'ib-success';
        successEl.className = 'ib-modal-success';

        errorEl = document.createElement('p');
        errorEl.id = 'ib-error';
        errorEl.className = 'ib-modal-error';

        body.appendChild(textareaEl);

        if (config.showEmailField !== false) {
            emailInputEl = document.createElement('input');
            emailInputEl.id = 'ib-email';
            emailInputEl.className = 'ib-modal-email';
            emailInputEl.type = 'email';
            emailInputEl.placeholder = 'Your email (optional)';
            emailInputEl.setAttribute('aria-label', 'Email address');
            body.appendChild(emailInputEl);
        }

        body.appendChild(errorEl);
        body.appendChild(successEl);
        body.appendChild(submitBtnEl);

        modal.appendChild(header);
        modal.appendChild(body);
        ov.appendChild(modal);

        ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
        document.addEventListener('keydown', handleKeydown);

        return ov;
    }

    function open(options?: OpenOptions) {
        if (overlay) return;

        currentOptions = options;
        overlay = buildDOM();
        document.body.appendChild(overlay);
        applyTheme(config);

        if (titleEl && options?.title) titleEl.textContent = options.title;

        if (options?.sentiment) {
            currentSentiment = options.sentiment;
            const upBtn = overlay.querySelector<HTMLButtonElement>('.ib-modal-thumb--up');
            const downBtn = overlay.querySelector<HTMLButtonElement>('.ib-modal-thumb--down');
            if (options.sentiment === 'positive') upBtn?.classList.add('ib-modal-thumb--active');
            else if (options.sentiment === 'negative') downBtn?.classList.add('ib-modal-thumb--active');
        }

        if (textareaEl && options?.prefill?.description) textareaEl.value = options.prefill.description;
        if (emailInputEl && options?.prefill?.email) emailInputEl.value = options.prefill.email;

        textareaEl?.focus();
    }

    function close() {
        if (!overlay) return;
        if (autoCloseTimer !== null) {
            clearTimeout(autoCloseTimer);
            autoCloseTimer = null;
        }
        document.removeEventListener('keydown', handleKeydown);
        overlay.remove();
        overlay = null;
        textareaEl = null;
        emailInputEl = null;
        submitBtnEl = null;
        errorEl = null;
        successEl = null;
        titleEl = null;
        currentOptions = undefined;
        currentSentiment = undefined;
        closeHandlers.forEach(h => h());
    }

    function on(event: 'submit' | 'close' | 'error', handler: SubmitHandler | CloseHandler | ErrorHandler): void {
        if (event === 'submit') submitHandlers.push(handler as SubmitHandler);
        else if (event === 'close') closeHandlers.push(handler as CloseHandler);
        else if (event === 'error') errorHandlers.push(handler as ErrorHandler);
    }

    function destroy() {
        close();
    }

    return { open, close, on, destroy };
}
