import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createModal } from './modal.js';

vi.mock('./api.js', () => ({
    submitFeedback: vi.fn(),
    WIDGET_VERSION: '1.0.0',
}));

vi.mock('./theme.js', () => ({
    applyTheme: vi.fn(),
}));

import { submitFeedback } from './api.js';

// Flush microtasks so async event handlers (handleSubmit) run to completion.
const flushMicrotasks = () => Promise.resolve().then(() => Promise.resolve());

describe('createModal', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
    });

    describe('open / close', () => {
        it('open() appends the overlay to the body', () => {
            const modal = createModal({ apiKey: 'key' });
            modal.open();
            expect(document.getElementById('ib-overlay')).not.toBeNull();
        });

        it('open() is a no-op when already open', () => {
            const modal = createModal({ apiKey: 'key' });
            modal.open();
            modal.open();
            expect(document.querySelectorAll('#ib-overlay')).toHaveLength(1);
        });

        it('close() removes the overlay', () => {
            const modal = createModal({ apiKey: 'key' });
            modal.open();
            modal.close();
            expect(document.getElementById('ib-overlay')).toBeNull();
        });

        it('close() is a no-op when not open', () => {
            const modal = createModal({ apiKey: 'key' });
            expect(() => modal.close()).not.toThrow();
        });

        it('Escape key closes the modal', () => {
            const modal = createModal({ apiKey: 'key' });
            modal.open();
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            expect(document.getElementById('ib-overlay')).toBeNull();
        });

        it('clicking the overlay backdrop closes the modal', () => {
            const modal = createModal({ apiKey: 'key' });
            modal.open();
            const overlay = document.getElementById('ib-overlay')!;
            overlay.dispatchEvent(new MouseEvent('click', { bubbles: false }));
            expect(document.getElementById('ib-overlay')).toBeNull();
        });

        it('clicking inside the modal does not close it', () => {
            const modal = createModal({ apiKey: 'key' });
            modal.open();
            document.getElementById('ib-modal')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            expect(document.getElementById('ib-overlay')).not.toBeNull();
        });

        it('close button closes the modal', () => {
            const modal = createModal({ apiKey: 'key' });
            modal.open();
            document.getElementById('ib-close')!.click();
            expect(document.getElementById('ib-overlay')).toBeNull();
        });

        it('destroy() closes the modal', () => {
            const modal = createModal({ apiKey: 'key' });
            modal.open();
            modal.destroy();
            expect(document.getElementById('ib-overlay')).toBeNull();
        });
    });

    describe('DOM structure', () => {
        it('renders overlay, modal, textarea, submit, success, error elements', () => {
            createModal({ apiKey: 'key' }).open();
            expect(document.getElementById('ib-overlay')).not.toBeNull();
            expect(document.getElementById('ib-modal')).not.toBeNull();
            expect(document.getElementById('ib-textarea')).not.toBeNull();
            expect(document.getElementById('ib-email')).toBeNull();
            expect(document.getElementById('ib-submit')).not.toBeNull();
            expect(document.getElementById('ib-success')).not.toBeNull();
            expect(document.getElementById('ib-error')).not.toBeNull();
        });

        it('renders title element when config.title is provided', () => {
            createModal({ apiKey: 'key', title: 'My Title' }).open();
            expect(document.getElementById('ib-title')).not.toBeNull();
        });

        it('renders no title element when none is configured', () => {
            createModal({ apiKey: 'key' }).open();
            expect(document.getElementById('ib-title')).toBeNull();
            expect(document.getElementById('ib-modal')!.getAttribute('aria-label')).toBe('Feedback');
        });

        it('uses config.title', () => {
            createModal({ apiKey: 'key', title: 'Rate us' }).open();
            expect(document.getElementById('ib-title')!.textContent).toBe('Rate us');
        });

        it('uses config.placeholder', () => {
            createModal({ apiKey: 'key', placeholder: 'Tell us more…' }).open();
            expect((document.getElementById('ib-textarea') as HTMLTextAreaElement).placeholder).toBe('Tell us more…');
        });

        it('uses the default placeholder when none is configured', () => {
            createModal({ apiKey: 'key' }).open();
            expect((document.getElementById('ib-textarea') as HTMLTextAreaElement).placeholder).toBe("What's on your mind?");
        });

        it('hides the email field by default', () => {
            createModal({ apiKey: 'key' }).open();
            expect(document.getElementById('ib-email')).toBeNull();
        });

        it('shows the email field when showEmailField is true', () => {
            createModal({ apiKey: 'key', showEmailField: true }).open();
            expect(document.getElementById('ib-email')).not.toBeNull();
        });

        it('modal has role=dialog and aria-modal', () => {
            createModal({ apiKey: 'key' }).open();
            const modalEl = document.getElementById('ib-modal')!;
            expect(modalEl.getAttribute('role')).toBe('dialog');
            expect(modalEl.getAttribute('aria-modal')).toBe('true');
        });
    });

    describe('showSentiment', () => {
        it('renders sentiment thumb buttons when showSentiment is true', () => {
            createModal({ apiKey: 'key', showSentiment: true }).open();
            expect(document.querySelector('.ib-modal-thumb--up')).not.toBeNull();
            expect(document.querySelector('.ib-modal-thumb--down')).not.toBeNull();
        });

        it('does not render sentiment buttons by default', () => {
            createModal({ apiKey: 'key' }).open();
            expect(document.querySelector('.ib-modal-thumb--up')).toBeNull();
        });

        it('clicking up thumb sets positive sentiment and active class', () => {
            createModal({ apiKey: 'key', showSentiment: true }).open();
            const upBtn = document.querySelector<HTMLButtonElement>('.ib-modal-thumb--up')!;
            const downBtn = document.querySelector<HTMLButtonElement>('.ib-modal-thumb--down')!;
            upBtn.click();
            expect(upBtn.classList.contains('ib-modal-thumb--active')).toBe(true);
            expect(downBtn.classList.contains('ib-modal-thumb--active')).toBe(false);
        });

        it('clicking down thumb sets negative sentiment and active class', () => {
            createModal({ apiKey: 'key', showSentiment: true }).open();
            const upBtn = document.querySelector<HTMLButtonElement>('.ib-modal-thumb--up')!;
            const downBtn = document.querySelector<HTMLButtonElement>('.ib-modal-thumb--down')!;
            downBtn.click();
            expect(downBtn.classList.contains('ib-modal-thumb--active')).toBe(true);
            expect(upBtn.classList.contains('ib-modal-thumb--active')).toBe(false);
        });

        it('sentiment from thumb click is passed to submitFeedback', async () => {
            vi.mocked(submitFeedback).mockResolvedValue({ id: '1' });
            createModal({ apiKey: 'key', showSentiment: true }).open();
            document.querySelector<HTMLButtonElement>('.ib-modal-thumb--up')!.click();
            (document.getElementById('ib-textarea') as HTMLTextAreaElement).value = 'This is valid feedback';
            document.getElementById('ib-submit')!.click();
            await flushMicrotasks();
            expect(vi.mocked(submitFeedback).mock.calls[0][4]).toMatchObject({ sentiment: 'positive' });
        });
    });

    describe('open() options', () => {
        it('overrides title with open options', () => {
            const modal = createModal({ apiKey: 'key', title: 'Config Title' });
            modal.open({ title: 'Runtime Title' });
            expect(document.getElementById('ib-title')!.textContent).toBe('Runtime Title');
        });

        it('creates title element from open options when no config title', () => {
            const modal = createModal({ apiKey: 'key' });
            modal.open({ title: 'Runtime Title' });
            expect(document.getElementById('ib-title')!.textContent).toBe('Runtime Title');
            expect(document.getElementById('ib-modal')!.getAttribute('aria-labelledby')).toBe('ib-title');
        });

        it('prefills textarea with description', () => {
            const modal = createModal({ apiKey: 'key' });
            modal.open({ prefill: { description: 'Prefilled feedback text' } });
            expect((document.getElementById('ib-textarea') as HTMLTextAreaElement).value).toBe('Prefilled feedback text');
        });

        it('prefills email input', () => {
            const modal = createModal({ apiKey: 'key', showEmailField: true });
            modal.open({ prefill: { email: 'user@example.com' } });
            expect((document.getElementById('ib-email') as HTMLInputElement).value).toBe('user@example.com');
        });

        it('pre-selects positive sentiment when opened with sentiment: positive', () => {
            createModal({ apiKey: 'key', showSentiment: true }).open({ sentiment: 'positive' });
            expect(document.querySelector('.ib-modal-thumb--up')!.classList.contains('ib-modal-thumb--active')).toBe(true);
        });

        it('pre-selects negative sentiment when opened with sentiment: negative', () => {
            createModal({ apiKey: 'key', showSentiment: true }).open({ sentiment: 'negative' });
            expect(document.querySelector('.ib-modal-thumb--down')!.classList.contains('ib-modal-thumb--active')).toBe(true);
        });
    });

    describe('form validation', () => {
        it('shows error and does not submit when description < 10 chars', async () => {
            createModal({ apiKey: 'key' }).open();
            (document.getElementById('ib-textarea') as HTMLTextAreaElement).value = 'short';
            document.getElementById('ib-submit')!.click();
            await flushMicrotasks();

            expect(submitFeedback).not.toHaveBeenCalled();
            const errorEl = document.getElementById('ib-error')!;
            expect(errorEl.textContent).toBe('Please enter at least 10 characters.');
            expect(errorEl.style.display).toBe('block');
        });

        it('clears the error message before a valid submit', async () => {
            vi.mocked(submitFeedback).mockResolvedValue({ id: '1' });
            createModal({ apiKey: 'key' }).open();
            const errorEl = document.getElementById('ib-error')!;
            errorEl.style.display = 'block';

            (document.getElementById('ib-textarea') as HTMLTextAreaElement).value = 'This is valid feedback';
            document.getElementById('ib-submit')!.click();
            await flushMicrotasks();

            expect(errorEl.style.display).toBe('none');
        });
    });

    describe('submission success', () => {
        it('calls submitFeedback with apiKey, description, and email', async () => {
            vi.mocked(submitFeedback).mockResolvedValue({ id: '1' });
            createModal({ apiKey: 'my-key', showEmailField: true }).open();

            (document.getElementById('ib-textarea') as HTMLTextAreaElement).value = 'This is valid feedback';
            (document.getElementById('ib-email') as HTMLInputElement).value = 'a@b.com';
            document.getElementById('ib-submit')!.click();
            await flushMicrotasks();

            expect(submitFeedback).toHaveBeenCalledWith('my-key', 'This is valid feedback', 'a@b.com', null, expect.objectContaining({ sentiment: undefined }), undefined);
        });

        it('uses prefill email when input is empty', async () => {
            vi.mocked(submitFeedback).mockResolvedValue({ id: '1' });
            createModal({ apiKey: 'key', showEmailField: true }).open({ prefill: { email: 'prefill@example.com' } });

            // Clear the email input that was prefilled
            (document.getElementById('ib-email') as HTMLInputElement).value = '';
            (document.getElementById('ib-textarea') as HTMLTextAreaElement).value = 'This is valid feedback';
            document.getElementById('ib-submit')!.click();
            await flushMicrotasks();

            expect(vi.mocked(submitFeedback).mock.calls[0][2]).toBe('prefill@example.com');
        });

        it('passes apiUrl from config to submitFeedback', async () => {
            vi.mocked(submitFeedback).mockResolvedValue({ id: '1' });
            createModal({ apiKey: 'key', apiUrl: 'http://localhost:3000/api/widget/inputs' }).open();

            (document.getElementById('ib-textarea') as HTMLTextAreaElement).value = 'This is valid feedback';
            document.getElementById('ib-submit')!.click();
            await flushMicrotasks();

            expect(vi.mocked(submitFeedback).mock.calls[0][5]).toBe('http://localhost:3000/api/widget/inputs');
        });

        it('passes target option to submitFeedback', async () => {
            vi.mocked(submitFeedback).mockResolvedValue({ id: '1' });
            createModal({ apiKey: 'key' }).open({ target: { type: 'documentation' } });

            (document.getElementById('ib-textarea') as HTMLTextAreaElement).value = 'This is valid feedback';
            document.getElementById('ib-submit')!.click();
            await flushMicrotasks();

            expect(vi.mocked(submitFeedback).mock.calls[0][4]).toMatchObject({ target: { type: 'documentation' } });
        });

        it('shows success message', async () => {
            vi.mocked(submitFeedback).mockResolvedValue({ id: '1' });
            createModal({ apiKey: 'key' }).open();

            (document.getElementById('ib-textarea') as HTMLTextAreaElement).value = 'This is valid feedback';
            document.getElementById('ib-submit')!.click();
            await flushMicrotasks();

            const successEl = document.getElementById('ib-success')!;
            expect(successEl.textContent).toBe('Thanks for your feedback!');
            expect(successEl.style.display).toBe('block');
        });

        it('fires submit event handlers', async () => {
            vi.mocked(submitFeedback).mockResolvedValue({ id: 'result-id' });
            const modal = createModal({ apiKey: 'key' });
            const handler = vi.fn();
            modal.on('submit', handler);
            modal.open();

            (document.getElementById('ib-textarea') as HTMLTextAreaElement).value = 'This is valid feedback';
            document.getElementById('ib-submit')!.click();
            await flushMicrotasks();

            expect(handler).toHaveBeenCalledWith({ id: 'result-id' });
        });

        it('auto-closes the modal after 2 seconds', async () => {
            vi.useFakeTimers();
            vi.mocked(submitFeedback).mockResolvedValue({ id: '1' });
            createModal({ apiKey: 'key' }).open();

            (document.getElementById('ib-textarea') as HTMLTextAreaElement).value = 'This is valid feedback';
            document.getElementById('ib-submit')!.click();
            await flushMicrotasks();

            expect(document.getElementById('ib-overlay')).not.toBeNull();
            vi.advanceTimersByTime(2000);
            expect(document.getElementById('ib-overlay')).toBeNull();
            vi.useRealTimers();
        });
    });

    describe('submission error', () => {
        it('shows the error message', async () => {
            vi.mocked(submitFeedback).mockRejectedValue(new Error('Server error'));
            createModal({ apiKey: 'key' }).open();

            (document.getElementById('ib-textarea') as HTMLTextAreaElement).value = 'This is valid feedback';
            document.getElementById('ib-submit')!.click();
            await flushMicrotasks();

            const errorEl = document.getElementById('ib-error')!;
            expect(errorEl.style.display).toBe('block');
        });

        it('re-enables the submit button', async () => {
            vi.mocked(submitFeedback).mockRejectedValue(new Error('Server error'));
            createModal({ apiKey: 'key' }).open();

            (document.getElementById('ib-textarea') as HTMLTextAreaElement).value = 'This is valid feedback';
            document.getElementById('ib-submit')!.click();
            await flushMicrotasks();

            const submitBtn = document.getElementById('ib-submit') as HTMLButtonElement;
            expect(submitBtn.disabled).toBe(false);
            expect(submitBtn.textContent).toBe('Send feedback');
        });

        it('fires error event handlers', async () => {
            const err = new Error('Network failure');
            vi.mocked(submitFeedback).mockRejectedValue(err);
            const modal = createModal({ apiKey: 'key' });
            const handler = vi.fn();
            modal.on('error', handler);
            modal.open();

            (document.getElementById('ib-textarea') as HTMLTextAreaElement).value = 'This is valid feedback';
            document.getElementById('ib-submit')!.click();
            await flushMicrotasks();

            expect(handler).toHaveBeenCalledWith(err);
        });

        it('wraps non-Error throws in an Error', async () => {
            vi.mocked(submitFeedback).mockRejectedValue('string error');
            const modal = createModal({ apiKey: 'key' });
            const handler = vi.fn();
            modal.on('error', handler);
            modal.open();

            (document.getElementById('ib-textarea') as HTMLTextAreaElement).value = 'This is valid feedback';
            document.getElementById('ib-submit')!.click();
            await flushMicrotasks();

            expect(handler).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe('event handlers', () => {
        it('fires close handlers on close()', () => {
            const modal = createModal({ apiKey: 'key' });
            const handler = vi.fn();
            modal.on('close', handler);
            modal.open();
            modal.close();
            expect(handler).toHaveBeenCalledTimes(1);
        });

        it('does not fire close handler before open/close', () => {
            const modal = createModal({ apiKey: 'key' });
            const handler = vi.fn();
            modal.on('close', handler);
            expect(handler).not.toHaveBeenCalled();
        });

        it('supports multiple handlers for the same event', () => {
            const modal = createModal({ apiKey: 'key' });
            const h1 = vi.fn();
            const h2 = vi.fn();
            modal.on('close', h1);
            modal.on('close', h2);
            modal.open();
            modal.close();
            expect(h1).toHaveBeenCalledTimes(1);
            expect(h2).toHaveBeenCalledTimes(1);
        });
    });
});
