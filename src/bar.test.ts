import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFeedbackBar } from './bar.js';

vi.mock('./api.js', () => ({
    submitFeedback: vi.fn(),
    submitReaction: vi.fn(),
    WIDGET_VERSION: '1.0.0',
}));

import { submitFeedback, submitReaction } from './api.js';

const flushMicrotasks = () => Promise.resolve().then(() => Promise.resolve());

describe('createFeedbackBar', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        // Stored reactions are keyed on apiKey + pathname, which every test here shares, so
        // without this a vote in one test restores itself in the next.
        localStorage.clear();
        vi.clearAllMocks();
        // Reactions are fire-and-forget, so the bar chains .catch() onto the returned promise.
        vi.mocked(submitReaction).mockResolvedValue({
            id: 'rx_1',
            target: { id: 'tg_1', type: 'documentation', display_name: '/docs', metadata: { page_url: '/docs' } },
            reaction_value: 1,
            created_at: '2026-05-12T14:30:00Z',
        });
    });

    describe('DOM structure', () => {
        it('returns an element and destroy function', () => {
            const bar = createFeedbackBar({ apiKey: 'key' });
            expect(bar.element).toBeInstanceOf(HTMLElement);
            expect(typeof bar.destroy).toBe('function');
        });

        it('uses default label', () => {
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            expect(bar.element.querySelector('.ib-bar-label')!.textContent).toBe('Was this helpful?');
        });

        it('uses custom label', () => {
            const bar = createFeedbackBar({ apiKey: 'key', label: 'Rate this page' });
            document.body.appendChild(bar.element);
            expect(bar.element.querySelector('.ib-bar-label')!.textContent).toBe('Rate this page');
        });

        it('hides label area when showLabel is false', () => {
            const bar = createFeedbackBar({ apiKey: 'key', showLabel: false });
            document.body.appendChild(bar.element);
            expect(bar.element.querySelector('.ib-bar-label-area')).toBeNull();
        });

        it('renders thumb buttons by default', () => {
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            expect(bar.element.querySelector('.ib-bar-btn--up')).not.toBeNull();
            expect(bar.element.querySelector('.ib-bar-btn--down')).not.toBeNull();
            expect(bar.element.querySelector('.ib-bar-actions')).not.toBeNull();
        });

        it('hides thumb buttons when showThumbs is false', () => {
            const bar = createFeedbackBar({ apiKey: 'key', showThumbs: false });
            document.body.appendChild(bar.element);
            expect(bar.element.querySelector('.ib-bar-btn--up')).toBeNull();
            expect(bar.element.querySelector('.ib-bar-btn--down')).toBeNull();
            // An empty actions div would still paint its border-left as a stray hairline.
            expect(bar.element.querySelector('.ib-bar-actions')).toBeNull();
        });

        it('renders the label area as a button when showThumbs is false', () => {
            const bar = createFeedbackBar({ apiKey: 'key', showThumbs: false, label: 'Give feedback' });
            document.body.appendChild(bar.element);
            const labelArea = bar.element.querySelector('.ib-bar-label-area')!;
            expect(labelArea).toBeInstanceOf(HTMLButtonElement);
            expect((labelArea as HTMLButtonElement).type).toBe('button');
            expect(labelArea.getAttribute('aria-haspopup')).toBe('dialog');
            expect(labelArea.getAttribute('aria-expanded')).toBe('false');
            expect(labelArea.className).toContain('ib-bar-label-area--trigger');
            expect(labelArea.querySelector('.ib-bar-label')!.textContent).toBe('Give feedback');
        });

        it('keeps the label area a div when thumbs are shown', () => {
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            const labelArea = bar.element.querySelector('.ib-bar-label-area')!;
            expect(labelArea.tagName).toBe('DIV');
            expect(labelArea.className).not.toContain('ib-bar-label-area--trigger');
        });

        it('keeps the label and warns when showThumbs and showLabel are both false', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const bar = createFeedbackBar({ apiKey: 'key', showThumbs: false, showLabel: false });
            document.body.appendChild(bar.element);
            expect(bar.element.querySelector('.ib-bar-label-area')).toBeInstanceOf(HTMLButtonElement);
            expect(warn).toHaveBeenCalled();
            warn.mockRestore();
        });

        it('does not warn when showThumbs is false and showLabel is unset', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            createFeedbackBar({ apiKey: 'key', showThumbs: false });
            expect(warn).not.toHaveBeenCalled();
            warn.mockRestore();
        });

        it('adds fixed placement class', () => {
            const bar = createFeedbackBar({ apiKey: 'key', placement: 'fixed' });
            expect(bar.element.className).toContain('ib-bar-wrapper--fixed');
        });

        it('does not add fixed class for inline placement', () => {
            const bar = createFeedbackBar({ apiKey: 'key', placement: 'inline' });
            expect(bar.element.className).not.toContain('ib-bar-wrapper--fixed');
        });

        it('applies dark color scheme class', () => {
            const bar = createFeedbackBar({ apiKey: 'key', colorScheme: 'dark' });
            expect(bar.element.className).toContain('ib-theme-dark');
        });

        it('applies light color scheme class', () => {
            const bar = createFeedbackBar({ apiKey: 'key', colorScheme: 'light' });
            expect(bar.element.className).toContain('ib-theme-light');
        });

        it('applies theme CSS properties', () => {
            const bar = createFeedbackBar({
                apiKey: 'key',
                theme: { primary: '#ff0000', background: '#ffffff', surface: '#eeeeee', text: '#000000' },
            });
            expect(bar.element.style.getPropertyValue('--ib-primary')).toBe('#ff0000');
            expect(bar.element.style.getPropertyValue('--ib-background')).toBe('#ffffff');
            expect(bar.element.style.getPropertyValue('--ib-text')).toBe('#000000');
        });

        it('uses custom modal title', () => {
            const bar = createFeedbackBar({ apiKey: 'key', modalTitle: 'How did we do?' });
            document.body.appendChild(bar.element);
            expect(bar.element.querySelector('.ib-bar-title')!.textContent).toBe('How did we do?');
        });

        it('renders no title element when modalTitle is not configured', () => {
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            expect(bar.element.querySelector('.ib-bar-title')).toBeNull();
            expect(bar.element.querySelector('.ib-bar-popover')!.getAttribute('aria-label')).toBe('Feedback');
        });

        it('uses custom modal placeholder', () => {
            const bar = createFeedbackBar({ apiKey: 'key', modalPlaceholder: 'Enter your thoughts' });
            document.body.appendChild(bar.element);
            expect((bar.element.querySelector('.ib-bar-textarea') as HTMLTextAreaElement).placeholder).toBe('Enter your thoughts');
        });

        it('never renders an email field', () => {
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            expect(bar.element.querySelector('.ib-bar-email')).toBeNull();
        });
    });

    describe('thumb buttons', () => {
        it('clicking up button opens the popover', () => {
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--up')!.click();
            expect(bar.element.querySelector('.ib-bar-popover')!.classList.contains('ib-bar-popover--visible')).toBe(true);
        });

        it('clicking down button opens the popover', () => {
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--down')!.click();
            expect(bar.element.querySelector('.ib-bar-popover')!.classList.contains('ib-bar-popover--visible')).toBe(true);
        });

        it('clicking up sets active class on up button', () => {
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            const upBtn = bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--up')!;
            upBtn.click();
            expect(upBtn.classList.contains('ib-bar-btn--active')).toBe(true);
        });

        it('clicking down clears up active class and sets down active', () => {
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            const upBtn = bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--up')!;
            const downBtn = bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--down')!;
            upBtn.click();
            downBtn.click();
            expect(upBtn.classList.contains('ib-bar-btn--active')).toBe(false);
            expect(downBtn.classList.contains('ib-bar-btn--active')).toBe(true);
        });
    });

    describe('label trigger', () => {
        const visible = (bar: { element: HTMLElement }) =>
            bar.element.querySelector('.ib-bar-popover')!.classList.contains('ib-bar-popover--visible');

        it('clicking the label area opens the popover when thumbs are hidden', () => {
            const bar = createFeedbackBar({ apiKey: 'key', showThumbs: false });
            document.body.appendChild(bar.element);
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-label-area')!.click();
            expect(visible(bar)).toBe(true);
        });

        it('clicking the label area again closes the popover', () => {
            const bar = createFeedbackBar({ apiKey: 'key', showThumbs: false });
            document.body.appendChild(bar.element);
            const labelArea = bar.element.querySelector<HTMLButtonElement>('.ib-bar-label-area')!;
            labelArea.click();
            labelArea.click();
            expect(visible(bar)).toBe(false);
        });

        it('toggles aria-expanded', () => {
            const bar = createFeedbackBar({ apiKey: 'key', showThumbs: false });
            document.body.appendChild(bar.element);
            const labelArea = bar.element.querySelector<HTMLButtonElement>('.ib-bar-label-area')!;
            labelArea.click();
            expect(labelArea.getAttribute('aria-expanded')).toBe('true');
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            expect(labelArea.getAttribute('aria-expanded')).toBe('false');
        });

        it('emits open with an undefined sentiment', () => {
            const bar = createFeedbackBar({ apiKey: 'key', showThumbs: false });
            document.body.appendChild(bar.element);
            const opens: { sentiment?: 'positive' | 'negative' }[] = [];
            bar.on('open', p => opens.push(p));
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-label-area')!.click();
            expect(opens).toHaveLength(1);
            expect('sentiment' in opens[0]).toBe(true);
            expect(opens[0].sentiment).toBeUndefined();
        });

        it('does not emit vote when the label area is clicked', () => {
            const bar = createFeedbackBar({ apiKey: 'key', showThumbs: false });
            document.body.appendChild(bar.element);
            const votes: unknown[] = [];
            bar.on('vote', p => votes.push(p));
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-label-area')!.click();
            expect(votes).toEqual([]);
        });

        it('clicking the label area does nothing when thumbs are shown', () => {
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            bar.element.querySelector<HTMLElement>('.ib-bar-label-area')!.click();
            expect(visible(bar)).toBe(false);
        });
    });

    describe('reactions', () => {
        const target = { type: 'documentation', metadata: { page_url: '/docs' } } as const;

        it('records a thumbs-up as reaction_value 1 when a target is configured', () => {
            const bar = createFeedbackBar({ apiKey: 'key', target });
            document.body.appendChild(bar.element);
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--up')!.click();
            expect(submitReaction).toHaveBeenCalledWith('key', 1, target, null, undefined);
        });

        it('records a thumbs-down as reaction_value -1', () => {
            const bar = createFeedbackBar({ apiKey: 'key', target });
            document.body.appendChild(bar.element);
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--down')!.click();
            expect(submitReaction).toHaveBeenCalledWith('key', -1, target, null, undefined);
        });

        it('forwards userId and apiUrl', () => {
            const bar = createFeedbackBar({
                apiKey: 'key', target, userId: 'user_12345', apiUrl: 'http://localhost:8080',
            });
            document.body.appendChild(bar.element);
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--up')!.click();
            expect(submitReaction).toHaveBeenCalledWith('key', 1, target, 'user_12345', 'http://localhost:8080');
        });

        it('does not call the reactions API without a target', () => {
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--up')!.click();
            expect(submitReaction).not.toHaveBeenCalled();
        });

        it('does not record a reaction when the label trigger opens the popover', () => {
            const bar = createFeedbackBar({ apiKey: 'key', target, showThumbs: false });
            document.body.appendChild(bar.element);
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-label-area')!.click();
            expect(submitReaction).not.toHaveBeenCalled();
        });

        it('restores a stored reaction on construction', () => {
            localStorage.setItem(
                `ib:reaction:key:${window.location.pathname}`,
                JSON.stringify({ sentiment: 'positive', ts: Date.now() }),
            );
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            expect(bar.element.querySelector('.ib-bar-btn--up')!.classList.contains('ib-bar-btn--active')).toBe(true);
        });

        it('still opens the popover when the reaction request fails', async () => {
            vi.mocked(submitReaction).mockRejectedValue(new Error('network'));
            const bar = createFeedbackBar({ apiKey: 'key', target });
            document.body.appendChild(bar.element);
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--up')!.click();
            await flushMicrotasks();
            expect(bar.element.querySelector('.ib-bar-popover')!.classList.contains('ib-bar-popover--visible')).toBe(true);
        });
    });

    describe('popover close', () => {
        it('Escape key closes the popover', () => {
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--up')!.click();
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            expect(bar.element.querySelector('.ib-bar-popover')!.classList.contains('ib-bar-popover--visible')).toBe(false);
        });

        it('non-Escape keydown does not close the popover', () => {
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--up')!.click();
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
            expect(bar.element.querySelector('.ib-bar-popover')!.classList.contains('ib-bar-popover--visible')).toBe(true);
        });

        it('clicking outside the wrapper closes the popover', async () => {
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--up')!.click();
            await new Promise(r => setTimeout(r, 0));
            document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            expect(bar.element.querySelector('.ib-bar-popover')!.classList.contains('ib-bar-popover--visible')).toBe(false);
        });

        it('clicking inside the wrapper does not close the popover', async () => {
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--up')!.click();
            await new Promise(r => setTimeout(r, 0));
            bar.element.dispatchEvent(new MouseEvent('click', { bubbles: false }));
            expect(bar.element.querySelector('.ib-bar-popover')!.classList.contains('ib-bar-popover--visible')).toBe(true);
        });
    });

    describe('submission', () => {
        it('shows error when description is too short', async () => {
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--up')!.click();
            (bar.element.querySelector('.ib-bar-textarea') as HTMLTextAreaElement).value = 'short';
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-submit')!.click();
            await flushMicrotasks();
            expect(bar.element.querySelector('.ib-bar-error')!.textContent).toBe('Please enter at least 10 characters.');
            expect(submitFeedback).not.toHaveBeenCalled();
        });

        it('calls submitFeedback with apiKey, description, title, and sentiment', async () => {
            vi.mocked(submitFeedback).mockResolvedValue({ id: '1' });
            const bar = createFeedbackBar({ apiKey: 'my-key' });
            document.body.appendChild(bar.element);
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--up')!.click();
            (bar.element.querySelector('.ib-bar-textarea') as HTMLTextAreaElement).value = 'This is valid feedback';
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-submit')!.click();
            await flushMicrotasks();
            expect(submitFeedback).toHaveBeenCalledWith('my-key', 'This is valid feedback', null, expect.objectContaining({ sentiment: 'positive' }), undefined);
        });

        it('passes negative sentiment when down button was clicked', async () => {
            vi.mocked(submitFeedback).mockResolvedValue({ id: '1' });
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--down')!.click();
            (bar.element.querySelector('.ib-bar-textarea') as HTMLTextAreaElement).value = 'This is valid feedback';
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-submit')!.click();
            await flushMicrotasks();
            expect(vi.mocked(submitFeedback).mock.calls[0][3]).toMatchObject({ sentiment: 'negative' });
        });

        it('submits with no sentiment when thumbs are hidden', async () => {
            vi.mocked(submitFeedback).mockResolvedValue({ id: '1' });
            const bar = createFeedbackBar({ apiKey: 'key', showThumbs: false });
            document.body.appendChild(bar.element);
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-label-area')!.click();
            (bar.element.querySelector('.ib-bar-textarea') as HTMLTextAreaElement).value = 'This is valid feedback';
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-submit')!.click();
            await flushMicrotasks();
            expect(vi.mocked(submitFeedback).mock.calls[0][3]!.sentiment).toBeUndefined();
        });

        it('ignores a stored reaction when thumbs are hidden', async () => {
            localStorage.setItem(
                `ib:reaction:key:${window.location.pathname}`,
                JSON.stringify({ sentiment: 'positive', ts: Date.now() }),
            );
            vi.mocked(submitFeedback).mockResolvedValue({ id: '1' });
            const bar = createFeedbackBar({ apiKey: 'key', showThumbs: false });
            document.body.appendChild(bar.element);
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-label-area')!.click();
            (bar.element.querySelector('.ib-bar-textarea') as HTMLTextAreaElement).value = 'This is valid feedback';
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-submit')!.click();
            await flushMicrotasks();
            expect(vi.mocked(submitFeedback).mock.calls[0][3]!.sentiment).toBeUndefined();
        });

        it('passes submittedBy when configured', async () => {
            vi.mocked(submitFeedback).mockResolvedValue({ id: '1' });
            const bar = createFeedbackBar({ apiKey: 'key', submittedBy: 'user_12345' });
            document.body.appendChild(bar.element);
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--up')!.click();
            (bar.element.querySelector('.ib-bar-textarea') as HTMLTextAreaElement).value = 'This is valid feedback';
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-submit')!.click();
            await flushMicrotasks();
            expect(vi.mocked(submitFeedback).mock.calls[0][3]).toMatchObject({ submittedBy: 'user_12345' });
        });

        it('passes apiUrl to submitFeedback', async () => {
            vi.mocked(submitFeedback).mockResolvedValue({ id: '1' });
            const bar = createFeedbackBar({ apiKey: 'key', apiUrl: 'http://localhost:8080' });
            document.body.appendChild(bar.element);
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--up')!.click();
            (bar.element.querySelector('.ib-bar-textarea') as HTMLTextAreaElement).value = 'This is valid feedback';
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-submit')!.click();
            await flushMicrotasks();
            expect(vi.mocked(submitFeedback).mock.calls[0][4]).toBe('http://localhost:8080');
        });

        it('shows success message after successful submit', async () => {
            vi.mocked(submitFeedback).mockResolvedValue({ id: '1' });
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--up')!.click();
            (bar.element.querySelector('.ib-bar-textarea') as HTMLTextAreaElement).value = 'This is valid feedback';
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-submit')!.click();
            await flushMicrotasks();
            expect(bar.element.querySelector('.ib-bar-success')!.textContent).toBe('Thanks for your feedback!');
        });

        it('auto-closes popover after 2 seconds on success', async () => {
            vi.useFakeTimers();
            vi.mocked(submitFeedback).mockResolvedValue({ id: '1' });
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--up')!.click();
            (bar.element.querySelector('.ib-bar-textarea') as HTMLTextAreaElement).value = 'This is valid feedback';
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-submit')!.click();
            await flushMicrotasks();
            vi.advanceTimersByTime(2000);
            expect(bar.element.querySelector('.ib-bar-popover')!.classList.contains('ib-bar-popover--visible')).toBe(false);
            vi.useRealTimers();
        });

        it('clears textarea value after popover closes on success', async () => {
            vi.useFakeTimers();
            vi.mocked(submitFeedback).mockResolvedValue({ id: '1' });
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--up')!.click();
            const textarea = bar.element.querySelector('.ib-bar-textarea') as HTMLTextAreaElement;
            textarea.value = 'This is valid feedback';
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-submit')!.click();
            await flushMicrotasks();
            vi.advanceTimersByTime(2000);
            expect(textarea.value).toBe('');
            vi.useRealTimers();
        });

        it('shows generic error message on submit failure', async () => {
            vi.mocked(submitFeedback).mockRejectedValue(new Error('Server error'));
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--up')!.click();
            (bar.element.querySelector('.ib-bar-textarea') as HTMLTextAreaElement).value = 'This is valid feedback';
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-submit')!.click();
            await flushMicrotasks();
            expect(bar.element.querySelector('.ib-bar-error')!.textContent).toBe('Something went wrong. Please try again.');
        });

        it('shows ApiError detail for user-category errors', async () => {
            const { ApiError } = await import('./types.js');
            vi.mocked(submitFeedback).mockRejectedValue(new ApiError({
                type: 'https://inputbuffer.io/problems/rate-limited',
                title: 'Rate Limited',
                detail: 'Too many requests. Please slow down.',
                status: 429,
                category: 'user',
            }));
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--up')!.click();
            (bar.element.querySelector('.ib-bar-textarea') as HTMLTextAreaElement).value = 'This is valid feedback';
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-submit')!.click();
            await flushMicrotasks();
            expect(bar.element.querySelector('.ib-bar-error')!.textContent).toBe('Too many requests. Please slow down.');
        });

        it('shows generic error message for non-Error throws', async () => {
            vi.mocked(submitFeedback).mockRejectedValue('string error');
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--up')!.click();
            (bar.element.querySelector('.ib-bar-textarea') as HTMLTextAreaElement).value = 'This is valid feedback';
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-submit')!.click();
            await flushMicrotasks();
            expect(bar.element.querySelector('.ib-bar-error')!.textContent).toBe('Something went wrong. Please try again.');
        });

        it('re-enables submit button on error', async () => {
            vi.mocked(submitFeedback).mockRejectedValue(new Error('Error'));
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--up')!.click();
            (bar.element.querySelector('.ib-bar-textarea') as HTMLTextAreaElement).value = 'This is valid feedback';
            const submitBtn = bar.element.querySelector<HTMLButtonElement>('.ib-bar-submit')!;
            submitBtn.click();
            await flushMicrotasks();
            expect(submitBtn.disabled).toBe(false);
            expect(submitBtn.textContent).toBe('Send feedback');
        });
    });

    describe('programmatic open/close', () => {
        const target = { type: 'documentation', metadata: { page_url: '/docs' } } as const;
        const visible = (bar: { element: HTMLElement }) =>
            bar.element.querySelector('.ib-bar-popover')!.classList.contains('ib-bar-popover--visible');

        it('open() shows the popover and emits open', () => {
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            const opens: { sentiment?: 'positive' | 'negative' }[] = [];
            bar.on('open', p => opens.push(p));
            bar.open();
            expect(visible(bar)).toBe(true);
            expect(opens).toHaveLength(1);
        });

        it('open(sentiment) sets the matching thumb active', () => {
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            bar.open('negative');
            expect(bar.element.querySelector('.ib-bar-btn--down')!.classList.contains('ib-bar-btn--active')).toBe(true);
            expect(bar.element.querySelector('.ib-bar-btn--up')!.classList.contains('ib-bar-btn--active')).toBe(false);
            bar.open('positive');
            expect(bar.element.querySelector('.ib-bar-btn--up')!.classList.contains('ib-bar-btn--active')).toBe(true);
            expect(bar.element.querySelector('.ib-bar-btn--down')!.classList.contains('ib-bar-btn--active')).toBe(false);
        });

        it('open() does not record a reaction, emit vote, or persist', () => {
            const bar = createFeedbackBar({ apiKey: 'key', target });
            document.body.appendChild(bar.element);
            const votes: unknown[] = [];
            bar.on('vote', p => votes.push(p));
            bar.open('positive');
            expect(submitReaction).not.toHaveBeenCalled();
            expect(votes).toEqual([]);
            expect(localStorage.length).toBe(0);
        });

        it('open(sentiment) then submitting sends that sentiment', async () => {
            vi.mocked(submitFeedback).mockResolvedValue({ id: '1' });
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            bar.open('positive');
            (bar.element.querySelector('.ib-bar-textarea') as HTMLTextAreaElement).value = 'This is valid feedback';
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-submit')!.click();
            await flushMicrotasks();
            expect(vi.mocked(submitFeedback).mock.calls[0][3]).toMatchObject({ sentiment: 'positive' });
        });

        it('open() preserves an already-selected sentiment', async () => {
            vi.mocked(submitFeedback).mockResolvedValue({ id: '1' });
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--up')!.click();
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            bar.open();
            (bar.element.querySelector('.ib-bar-textarea') as HTMLTextAreaElement).value = 'This is valid feedback';
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-submit')!.click();
            await flushMicrotasks();
            expect(vi.mocked(submitFeedback).mock.calls[0][3]).toMatchObject({ sentiment: 'positive' });
        });

        it('open() works when thumbs are hidden and sets aria-expanded', () => {
            const bar = createFeedbackBar({ apiKey: 'key', showThumbs: false });
            document.body.appendChild(bar.element);
            bar.open();
            expect(visible(bar)).toBe(true);
            expect(bar.element.querySelector('.ib-bar-label-area')!.getAttribute('aria-expanded')).toBe('true');
        });

        it('close() hides the popover and emits close', () => {
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            let closed = false;
            bar.on('close', () => { closed = true; });
            bar.open();
            bar.close();
            expect(visible(bar)).toBe(false);
            expect(closed).toBe(true);
        });

        it('close() on a closed popover does not emit close', () => {
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            let closed = false;
            bar.on('close', () => { closed = true; });
            bar.close();
            expect(closed).toBe(false);
        });
    });

    describe('destroy', () => {
        it('removes the element from the DOM', () => {
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            bar.destroy();
            expect(document.body.contains(bar.element)).toBe(false);
        });
    });

    describe('events', () => {
        it('exposes an on() method', () => {
            const bar = createFeedbackBar({ apiKey: 'key' });
            expect(typeof bar.on).toBe('function');
        });

        it('emits vote with positive sentiment when up button clicked', () => {
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            const votes: unknown[] = [];
            bar.on('vote', (p: { sentiment: 'positive' | 'negative' }) => votes.push(p));
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--up')!.click();
            expect(votes).toEqual([{ sentiment: 'positive' }]);
        });

        it('emits vote with negative sentiment when down button clicked', () => {
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            const votes: unknown[] = [];
            bar.on('vote', (p: { sentiment: 'positive' | 'negative' }) => votes.push(p));
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--down')!.click();
            expect(votes).toEqual([{ sentiment: 'negative' }]);
        });

        it('emits open with sentiment when popover opens', () => {
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            const opens: unknown[] = [];
            bar.on('open', (p: { sentiment?: 'positive' | 'negative' }) => opens.push(p));
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--up')!.click();
            expect(opens).toEqual([{ sentiment: 'positive' }]);
        });

        it('emits close when popover closes via Escape', () => {
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            let closed = false;
            bar.on('close', () => { closed = true; });
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--up')!.click();
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            expect(closed).toBe(true);
        });

        it('emits submit with id on successful submission', async () => {
            vi.mocked(submitFeedback).mockResolvedValue({ id: 'abc123' });
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            const submits: unknown[] = [];
            bar.on('submit', (r: { id: string }) => submits.push(r));
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--up')!.click();
            (bar.element.querySelector('.ib-bar-textarea') as HTMLTextAreaElement).value = 'This is valid feedback';
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-submit')!.click();
            await flushMicrotasks();
            expect(submits).toEqual([{ id: 'abc123' }]);
        });

        it('emits error with Error object on submission failure', async () => {
            vi.mocked(submitFeedback).mockRejectedValue(new Error('Network error'));
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            const errors: unknown[] = [];
            bar.on('error', (e: Error) => errors.push(e));
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--up')!.click();
            (bar.element.querySelector('.ib-bar-textarea') as HTMLTextAreaElement).value = 'This is valid feedback';
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-submit')!.click();
            await flushMicrotasks();
            expect(errors).toHaveLength(1);
            expect(errors[0]).toBeInstanceOf(Error);
            expect((errors[0] as Error).message).toBe('Network error');
        });

        it('supports multiple handlers for the same event', () => {
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            const calls: string[] = [];
            bar.on('vote', () => calls.push('a'));
            bar.on('vote', () => calls.push('b'));
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--up')!.click();
            expect(calls).toEqual(['a', 'b']);
        });
    });
});
