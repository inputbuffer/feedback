import type { FeedbackBarConfig, FeedbackBarInstance } from './types.js';
import { submitFeedback, submitReaction } from './api.js';

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

const REACTION_TTL = 24 * 60 * 60 * 1000;

export function createFeedbackBar(config: FeedbackBarConfig): FeedbackBarInstance {
    let currentSentiment: 'positive' | 'negative' | undefined;

    function storageKey(): string {
        const t = config.target;
        if (!t) return `ib:reaction:${config.apiKey}:${window.location.pathname}`;
        if (t.targetId) return `ib:reaction:${config.apiKey}:${t.targetId}`;
        return `ib:reaction:${config.apiKey}:${t.type}:${JSON.stringify(t.metadata)}`;
    }

    function loadStoredReaction(): 'positive' | 'negative' | null {
        try {
            const raw = localStorage.getItem(storageKey());
            if (!raw) return null;
            const { sentiment, ts } = JSON.parse(raw);
            if (Date.now() - ts > REACTION_TTL) { localStorage.removeItem(storageKey()); return null; }
            return sentiment;
        } catch { return null; }
    }

    function saveReaction(sentiment: 'positive' | 'negative') {
        try { localStorage.setItem(storageKey(), JSON.stringify({ sentiment, ts: Date.now() })); }
        catch { /* quota exceeded */ }
    }

    const handlers: Record<string, Function[]> = {
        vote: [], open: [], submit: [], close: [], error: [],
    };

    function emit(event: string, payload?: unknown) {
        handlers[event]?.forEach(h => h(payload));
    }

    // Wrapper provides positioning context for the popover
    const wrapper = document.createElement('div');
    const schemeClass = config.colorScheme === 'dark' ? ' ib-theme-dark'
                      : config.colorScheme === 'light' ? ' ib-theme-light' : '';
    wrapper.className = 'ib-bar-wrapper' + (config.placement === 'fixed' ? ' ib-bar-wrapper--fixed' : '') + schemeClass;

    const { theme = {} } = config;
    if (theme.primary) wrapper.style.setProperty('--ib-primary', theme.primary);
    if (theme.background) wrapper.style.setProperty('--ib-background', theme.background);
    if (theme.surface) wrapper.style.setProperty('--ib-surface', theme.surface);
    if (theme.text) wrapper.style.setProperty('--ib-text', theme.text);
    if (theme.selected) wrapper.style.setProperty('--ib-selected', theme.selected);
    if (theme.selectedColor) wrapper.style.setProperty('--ib-selected-color', theme.selectedColor);

    // Bar
    const bar = document.createElement('div');
    bar.className = 'ib-bar';

    const labelArea = document.createElement('div');
    labelArea.className = 'ib-bar-label-area';
    const label = document.createElement('span');
    label.className = 'ib-bar-label';
    label.textContent = config.label ?? 'Was this helpful?';
    labelArea.appendChild(label);

    const actions = document.createElement('div');
    actions.className = 'ib-bar-actions' + (config.showLabel === false ? ' ib-bar-actions--no-label' : '');

    const upBtn = document.createElement('button');
    upBtn.type = 'button';
    upBtn.className = 'ib-bar-btn ib-bar-btn--up';
    upBtn.setAttribute('aria-label', 'Yes');
    upBtn.appendChild(svgIcon(THUMB_UP));

    const downBtn = document.createElement('button');
    downBtn.type = 'button';
    downBtn.className = 'ib-bar-btn ib-bar-btn--down';
    downBtn.setAttribute('aria-label', 'No');
    downBtn.appendChild(svgIcon(THUMB_DOWN));

    actions.appendChild(upBtn);
    actions.appendChild(downBtn);
    if (config.showLabel !== false) bar.appendChild(labelArea);
    bar.appendChild(actions);

    // Popover
    const popover = document.createElement('div');
    popover.className = 'ib-bar-popover';
    popover.setAttribute('role', 'dialog');
    popover.setAttribute('aria-modal', 'false');
    const popoverHeader = document.createElement('div');
    popoverHeader.className = 'ib-bar-header';

    if (config.modalTitle) {
        popover.setAttribute('aria-labelledby', 'ib-bar-title');
        const popoverTitle = document.createElement('p');
        popoverTitle.id = 'ib-bar-title';
        popoverTitle.className = 'ib-bar-title';
        popoverTitle.textContent = config.modalTitle;
        popoverHeader.appendChild(popoverTitle);
    } else {
        popover.setAttribute('aria-label', 'Feedback');
    }

    const popoverBody = document.createElement('div');
    popoverBody.className = 'ib-bar-body';

    const textarea = document.createElement('textarea');
    textarea.className = 'ib-bar-textarea';
    textarea.placeholder = config.modalPlaceholder ?? "What's on your mind?";
    textarea.setAttribute('aria-label', 'Feedback');

    const errorEl = document.createElement('p');
    errorEl.className = 'ib-bar-error';

    const successEl = document.createElement('p');
    successEl.className = 'ib-bar-success';

    const submitBtn = document.createElement('button');
    submitBtn.type = 'button';
    submitBtn.className = 'ib-bar-submit';
    submitBtn.textContent = 'Send feedback';

    if (config.showTitleField === true) {
        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.className = 'ib-bar-title-input';
        titleInput.placeholder = 'Title (optional)';
        titleInput.setAttribute('aria-label', 'Feedback title');
        popoverBody.appendChild(titleInput);
    }

    popoverBody.appendChild(textarea);

    if (config.showEmailField === true) {
        const emailInput = document.createElement('input');
        emailInput.type = 'email';
        emailInput.className = 'ib-bar-email';
        emailInput.placeholder = 'Your email (optional)';
        emailInput.setAttribute('aria-label', 'Email address');
        popoverBody.appendChild(emailInput);
    }

    popoverBody.appendChild(errorEl);
    popoverBody.appendChild(successEl);

    const footer = document.createElement('div');
    footer.className = 'ib-bar-footer';
    footer.appendChild(submitBtn);

    const branding = document.createElement('div');
    branding.className = 'ib-branding';
    const brandingLink = document.createElement('a');
    brandingLink.href = 'https://inputbuffer.io';
    brandingLink.target = '_blank';
    brandingLink.rel = 'noopener noreferrer';
    brandingLink.textContent = 'Powered by inputbuffer.io';
    branding.appendChild(brandingLink);
    footer.appendChild(branding);
    popoverBody.appendChild(footer);

    popover.appendChild(popoverHeader);
    popover.appendChild(popoverBody);

    wrapper.appendChild(popover);
    wrapper.appendChild(bar);

    function positionPopover() {
        const rect = bar.getBoundingClientRect();
        popover.style.top = `${rect.top - popover.offsetHeight - 8}px`;
        popover.style.left = `${rect.right - 320}px`;
    }

    // Popover open/close
    function openPopover(sentiment: 'positive' | 'negative') {
        currentSentiment = sentiment;
        popover.classList.add('ib-bar-popover--visible');
        // Position after display:block takes effect so offsetHeight is accurate
        requestAnimationFrame(positionPopover);
        errorEl.textContent = '';
        successEl.textContent = '';
        textarea.focus();
        setTimeout(() => document.addEventListener('click', handleOutsideClick), 0);
        document.addEventListener('keydown', handleKeydown);
        window.addEventListener('scroll', positionPopover, { passive: true });
        window.addEventListener('resize', positionPopover, { passive: true });
        emit('open', { sentiment });
    }

    function closePopover() {
        if (!popover.classList.contains('ib-bar-popover--visible')) return;
        popover.classList.remove('ib-bar-popover--visible');
        document.removeEventListener('click', handleOutsideClick);
        document.removeEventListener('keydown', handleKeydown);
        window.removeEventListener('scroll', positionPopover);
        window.removeEventListener('resize', positionPopover);
        textarea.value = '';
        emit('close');
    }

    function clearSelection() {
        upBtn.classList.remove('ib-bar-btn--active');
        downBtn.classList.remove('ib-bar-btn--active');
        currentSentiment = undefined;
    }

    function handleOutsideClick(e: MouseEvent) {
        if (!wrapper.contains(e.target as Node)) closePopover();
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Escape') closePopover();
    }

    async function handleSubmit() {
        const description = textarea.value.trim();
        if (description.length < 10) {
            errorEl.textContent = 'Please enter at least 10 characters.';
            return;
        }

        errorEl.textContent = '';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';

        const titleInput = popover.querySelector<HTMLInputElement>('.ib-bar-title-input');
        const title = titleInput?.value.trim() || null;
        const emailInput = popover.querySelector<HTMLInputElement>('.ib-bar-email');
        const email = emailInput?.value.trim() || null;

        try {
            const result = await submitFeedback(
                config.apiKey, description, email, title,
                { sentiment: currentSentiment, target: config.target, source: config.source },
                config.apiUrl
            );
            emit('submit', result);
            successEl.textContent = 'Thanks for your feedback!';
            submitBtn.textContent = 'Send feedback';
            setTimeout(() => { closePopover(); clearSelection(); }, 2000);
        } catch (err) {
            emit('error', err instanceof Error ? err : new Error('Something went wrong.'));
            errorEl.textContent = err instanceof Error ? err.message : 'Something went wrong.';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send feedback';
        }
    }

    function setActive(btn: HTMLButtonElement) {
        upBtn.classList.remove('ib-bar-btn--active');
        downBtn.classList.remove('ib-bar-btn--active');
        btn.classList.add('ib-bar-btn--active');
    }

    const stored = loadStoredReaction();
    if (stored) {
        currentSentiment = stored;
        setActive(stored === 'positive' ? upBtn : downBtn);
    }

    function handleVote(sentiment: 'positive' | 'negative', btn: HTMLButtonElement) {
        saveReaction(sentiment);
        setActive(btn);
        openPopover(sentiment);
        emit('vote', { sentiment });
        if (config.target) {
            submitReaction(
                config.apiKey,
                sentiment === 'positive' ? 1 : -1,
                config.target,
                config.userId ?? null,
                config.apiUrl
            ).catch(() => { /* best-effort */ });
        }
    }

    upBtn.addEventListener('click', () => handleVote('positive', upBtn));
    downBtn.addEventListener('click', () => handleVote('negative', downBtn));
    submitBtn.addEventListener('click', handleSubmit);

    return {
        element: wrapper,
        on(event, handler) {
            handlers[event]?.push(handler);
        },
        destroy() {
            closePopover();
            wrapper.remove();
        },
    };
}
