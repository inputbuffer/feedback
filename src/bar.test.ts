import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFeedbackBar } from './bar.js';

vi.mock('./api.js', () => ({
    submitFeedback: vi.fn(),
    WIDGET_VERSION: '1.0.0',
}));

import { submitFeedback } from './api.js';

const flushMicrotasks = () => Promise.resolve().then(() => Promise.resolve());

describe('createFeedbackBar', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
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

        it('uses default modal title', () => {
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            expect(bar.element.querySelector('.ib-bar-title')!.textContent).toBe('Share your feedback');
        });

        it('uses custom modal placeholder', () => {
            const bar = createFeedbackBar({ apiKey: 'key', modalPlaceholder: 'Enter your thoughts' });
            document.body.appendChild(bar.element);
            expect((bar.element.querySelector('.ib-bar-textarea') as HTMLTextAreaElement).placeholder).toBe('Enter your thoughts');
        });

        it('shows email field by default', () => {
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            expect(bar.element.querySelector('.ib-bar-email')).not.toBeNull();
        });

        it('hides email field when showEmailField is false', () => {
            const bar = createFeedbackBar({ apiKey: 'key', showEmailField: false });
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

        it('calls submitFeedback with apiKey, description, sentiment, and null email', async () => {
            vi.mocked(submitFeedback).mockResolvedValue({ id: '1' });
            const bar = createFeedbackBar({ apiKey: 'my-key' });
            document.body.appendChild(bar.element);
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--up')!.click();
            (bar.element.querySelector('.ib-bar-textarea') as HTMLTextAreaElement).value = 'This is valid feedback';
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-submit')!.click();
            await flushMicrotasks();
            expect(submitFeedback).toHaveBeenCalledWith('my-key', 'This is valid feedback', null, { sentiment: 'positive' }, undefined);
        });

        it('passes negative sentiment when down button was clicked', async () => {
            vi.mocked(submitFeedback).mockResolvedValue({ id: '1' });
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--down')!.click();
            (bar.element.querySelector('.ib-bar-textarea') as HTMLTextAreaElement).value = 'This is valid feedback';
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-submit')!.click();
            await flushMicrotasks();
            expect(vi.mocked(submitFeedback).mock.calls[0][3]).toEqual({ sentiment: 'negative' });
        });

        it('passes email when entered', async () => {
            vi.mocked(submitFeedback).mockResolvedValue({ id: '1' });
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--up')!.click();
            (bar.element.querySelector('.ib-bar-textarea') as HTMLTextAreaElement).value = 'This is valid feedback';
            (bar.element.querySelector('.ib-bar-email') as HTMLInputElement).value = 'user@example.com';
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-submit')!.click();
            await flushMicrotasks();
            expect(vi.mocked(submitFeedback).mock.calls[0][2]).toBe('user@example.com');
        });

        it('passes apiUrl to submitFeedback', async () => {
            vi.mocked(submitFeedback).mockResolvedValue({ id: '1' });
            const bar = createFeedbackBar({ apiKey: 'key', apiUrl: 'https://custom.api/inputs' });
            document.body.appendChild(bar.element);
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--up')!.click();
            (bar.element.querySelector('.ib-bar-textarea') as HTMLTextAreaElement).value = 'This is valid feedback';
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-submit')!.click();
            await flushMicrotasks();
            expect(vi.mocked(submitFeedback).mock.calls[0][4]).toBe('https://custom.api/inputs');
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

        it('shows error message on submit failure', async () => {
            vi.mocked(submitFeedback).mockRejectedValue(new Error('Server error'));
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--up')!.click();
            (bar.element.querySelector('.ib-bar-textarea') as HTMLTextAreaElement).value = 'This is valid feedback';
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-submit')!.click();
            await flushMicrotasks();
            expect(bar.element.querySelector('.ib-bar-error')!.textContent).toBe('Server error');
        });

        it('falls back to generic error message for non-Error throws', async () => {
            vi.mocked(submitFeedback).mockRejectedValue('string error');
            const bar = createFeedbackBar({ apiKey: 'key' });
            document.body.appendChild(bar.element);
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-btn--up')!.click();
            (bar.element.querySelector('.ib-bar-textarea') as HTMLTextAreaElement).value = 'This is valid feedback';
            bar.element.querySelector<HTMLButtonElement>('.ib-bar-submit')!.click();
            await flushMicrotasks();
            expect(bar.element.querySelector('.ib-bar-error')!.textContent).toBe('Something went wrong.');
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
            bar.on('open', (p: { sentiment: 'positive' | 'negative' }) => opens.push(p));
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
