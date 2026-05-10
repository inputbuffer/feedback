import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('./bar.js', () => ({
    createFeedbackBar: vi.fn(() => ({
        element: document.createElement('div'),
        on: vi.fn(),
        destroy: vi.fn(),
    })),
}));

import { createFeedbackBar } from './bar.js';
import { InputBufferIO, createBar } from './bar-entry.js';

describe('bar-entry', () => {
    beforeEach(() => {
        document.head.innerHTML = '';
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('createBar()', () => {
        it('calls createFeedbackBar with the provided config', () => {
            createBar({ apiKey: 'test-key' });
            expect(createFeedbackBar).toHaveBeenCalledWith(expect.objectContaining({ apiKey: 'test-key' }));
        });

        it('returns a FeedbackBarInstance with element and destroy', () => {
            const bar = createBar({ apiKey: 'key' });
            expect(bar.element).toBeInstanceOf(HTMLElement);
            expect(typeof bar.destroy).toBe('function');
        });

        it('injects styles by default', () => {
            createBar({ apiKey: 'key' });
            expect(document.getElementById('ib-bar-styles')).not.toBeNull();
        });

        it('injects styles only once across multiple calls', () => {
            createBar({ apiKey: 'key' });
            createBar({ apiKey: 'key2' });
            expect(document.querySelectorAll('#ib-bar-styles')).toHaveLength(1);
        });

        it('skips style injection when injectStyles is false', () => {
            createBar({ apiKey: 'key', injectStyles: false });
            expect(document.getElementById('ib-bar-styles')).toBeNull();
        });
    });

    describe('window.InputBufferIO', () => {
        it('is set on the global window object', () => {
            expect((window as unknown as Record<string, unknown>)['InputBufferIO']).toBeDefined();
        });

        it('exposes createBar and version', () => {
            const io = (window as unknown as Record<string, unknown>)['InputBufferIO'] as typeof InputBufferIO;
            expect(typeof io.createBar).toBe('function');
            expect(typeof io.version).toBe('string');
        });
    });

    describe('SSR guards', () => {
        it('injectStyles does not throw when document is undefined', () => {
            vi.mocked(createFeedbackBar).mockReturnValueOnce({ element: {} as HTMLElement, on: vi.fn(), destroy: vi.fn() });
            vi.stubGlobal('document', undefined);
            expect(() => createBar({ apiKey: 'k' })).not.toThrow();
        });

        it('injectStyles does not inject styles when document is undefined', () => {
            vi.mocked(createFeedbackBar).mockReturnValueOnce({ element: {} as HTMLElement, on: vi.fn(), destroy: vi.fn() });
            vi.stubGlobal('document', undefined);
            createBar({ apiKey: 'k' });
            vi.unstubAllGlobals();
            expect(document.getElementById('ib-bar-styles')).toBeNull();
        });
    });
});
