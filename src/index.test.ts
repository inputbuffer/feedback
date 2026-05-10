import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('./modal.js', () => ({
    createModal: vi.fn(() => ({
        open: vi.fn(),
        close: vi.fn(),
        on: vi.fn(),
        destroy: vi.fn(),
    })),
}));

vi.mock('./bar.js', () => ({
    createFeedbackBar: vi.fn(() => ({
        element: document.createElement('div'),
        destroy: vi.fn(),
    })),
}));

import { createModal } from './modal.js';
import { createFeedbackBar } from './bar.js';
import { InputBufferIO } from './index.js';

describe('InputBufferIO', () => {
    beforeEach(() => {
        document.head.innerHTML = '';
        document.body.innerHTML = '';
        vi.clearAllMocks();
    });

    describe('version', () => {
        it('exposes a version string', () => {
            expect(typeof InputBufferIO.version).toBe('string');
            expect(InputBufferIO.version.length).toBeGreaterThan(0);
        });
    });

    describe('createModal()', () => {
        it('calls createModal with the provided config', () => {
            InputBufferIO.createModal({ apiKey: 'test-key' });
            expect(createModal).toHaveBeenCalledWith(expect.objectContaining({ apiKey: 'test-key' }));
        });

        it('returns a WidgetInstance with open/close/on/destroy', () => {
            const instance = InputBufferIO.createModal({ apiKey: 'key' });
            expect(typeof instance.open).toBe('function');
            expect(typeof instance.close).toBe('function');
            expect(typeof instance.on).toBe('function');
            expect(typeof instance.destroy).toBe('function');
        });

        it('injects a stylesheet link tag into <head>', () => {
            InputBufferIO.createModal({ apiKey: 'key' });
            expect(document.getElementById('ib-modal-styles')).not.toBeNull();
        });

        it('only injects the stylesheet once across multiple createModal() calls', () => {
            InputBufferIO.createModal({ apiKey: 'key' });
            InputBufferIO.createModal({ apiKey: 'key2' });
            expect(document.querySelectorAll('#ib-modal-styles')).toHaveLength(1);
        });

        it('skips stylesheet injection when injectStyles is false', () => {
            document.getElementById('ib-modal-styles')?.remove();
            InputBufferIO.createModal({ apiKey: 'key', injectStyles: false });
            expect(document.getElementById('ib-modal-styles')).toBeNull();
        });

        it('attaches a click listener to attachTo element that calls open()', () => {
            const btn = document.createElement('button');
            btn.id = 'feedback-btn';
            document.body.appendChild(btn);

            InputBufferIO.createModal({ apiKey: 'key', attachTo: '#feedback-btn' });
            const mockInstance = vi.mocked(createModal).mock.results[0].value;
            btn.click();
            expect(mockInstance.open).toHaveBeenCalledTimes(1);
        });

        it('does not throw when attachTo selector matches nothing', () => {
            expect(() => InputBufferIO.createModal({ apiKey: 'key', attachTo: '#nonexistent' })).not.toThrow();
        });

        it('removes the click listener on destroy()', () => {
            const btn = document.createElement('button');
            btn.id = 'feedback-btn';
            document.body.appendChild(btn);

            const instance = InputBufferIO.createModal({ apiKey: 'key', attachTo: '#feedback-btn' });
            const mockInstance = vi.mocked(createModal).mock.results[0].value;
            instance.destroy();
            btn.click();
            expect(mockInstance.open).not.toHaveBeenCalled();
        });
    });

    describe('window.InputBufferIO', () => {
        it('is set on the global window object', () => {
            expect((window as unknown as Record<string, unknown>)['InputBufferIO']).toBeDefined();
        });
    });

    describe('createBar()', () => {
        it('calls createFeedbackBar with the provided config', () => {
            InputBufferIO.createBar({ apiKey: 'bar-key' });
            expect(createFeedbackBar).toHaveBeenCalledWith(expect.objectContaining({ apiKey: 'bar-key' }));
        });

        it('returns a FeedbackBarInstance with element and destroy', () => {
            const bar = InputBufferIO.createBar({ apiKey: 'key' });
            expect(bar.element).toBeInstanceOf(HTMLElement);
            expect(typeof bar.destroy).toBe('function');
        });

        it('injects stylesheet when creating a bar', () => {
            document.getElementById('ib-bar-styles')?.remove();
            InputBufferIO.createBar({ apiKey: 'key' });
            expect(document.getElementById('ib-bar-styles')).not.toBeNull();
        });
    });

    describe('SSR guards', () => {
        afterEach(() => {
            vi.unstubAllGlobals();
        });

        it('createModal does not throw when document is undefined', () => {
            vi.stubGlobal('document', undefined);
            expect(() => InputBufferIO.createModal({ apiKey: 'k' })).not.toThrow();
        });

        it('createModal does not inject styles when document is undefined', () => {
            document.getElementById('ib-modal-styles')?.remove();
            vi.stubGlobal('document', undefined);
            InputBufferIO.createModal({ apiKey: 'k' });
            vi.unstubAllGlobals();
            expect(document.getElementById('ib-modal-styles')).toBeNull();
        });

        it('createBar does not throw when document is undefined', () => {
            vi.mocked(createFeedbackBar).mockReturnValueOnce({ element: {} as HTMLElement, on: vi.fn(), destroy: vi.fn() });
            vi.stubGlobal('document', undefined);
            expect(() => InputBufferIO.createBar({ apiKey: 'k' })).not.toThrow();
        });

        it('createBar does not inject styles when document is undefined', () => {
            document.getElementById('ib-bar-styles')?.remove();
            vi.mocked(createFeedbackBar).mockReturnValueOnce({ element: {} as HTMLElement, on: vi.fn(), destroy: vi.fn() });
            vi.stubGlobal('document', undefined);
            InputBufferIO.createBar({ apiKey: 'k' });
            vi.unstubAllGlobals();
            expect(document.getElementById('ib-bar-styles')).toBeNull();
        });
    });

    describe('InputBufferIOFeedbackElement', () => {
        it('calls createFeedbackBar when connected with an api-key attribute', () => {
            const el = document.createElement('inputbuffer-feedback');
            el.setAttribute('api-key', 'element-key');
            document.body.appendChild(el);
            expect(createFeedbackBar).toHaveBeenCalledWith(expect.objectContaining({ apiKey: 'element-key' }));
        });

        it('does nothing when connected without an api-key attribute', () => {
            vi.clearAllMocks();
            const el = document.createElement('inputbuffer-feedback');
            document.body.appendChild(el);
            expect(createFeedbackBar).not.toHaveBeenCalled();
        });

        it('calls destroy on the bar instance when disconnected', () => {
            const destroyFn = vi.fn();
            vi.mocked(createFeedbackBar).mockReturnValueOnce({ element: document.createElement('div'), on: vi.fn(), destroy: destroyFn });
            const el = document.createElement('inputbuffer-feedback');
            el.setAttribute('api-key', 'key');
            document.body.appendChild(el);
            document.body.removeChild(el);
            expect(destroyFn).toHaveBeenCalledTimes(1);
        });

        it('passes placement attribute to createFeedbackBar', () => {
            const el = document.createElement('inputbuffer-feedback');
            el.setAttribute('api-key', 'key');
            el.setAttribute('placement', 'fixed');
            document.body.appendChild(el);
            expect(createFeedbackBar).toHaveBeenCalledWith(expect.objectContaining({ placement: 'fixed' }));
        });

        it('defaults placement to inline when attribute is not fixed', () => {
            const el = document.createElement('inputbuffer-feedback');
            el.setAttribute('api-key', 'key');
            document.body.appendChild(el);
            expect(createFeedbackBar).toHaveBeenCalledWith(expect.objectContaining({ placement: 'inline' }));
        });
    });
});
