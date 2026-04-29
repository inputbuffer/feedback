import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitFeedback, WIDGET_VERSION } from './api.js';

describe('submitFeedback', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    function mockOk(body: unknown) {
        vi.mocked(fetch).mockResolvedValue({
            ok: true,
            json: async () => body,
        } as Response);
    }

    function mockError(body: unknown) {
        vi.mocked(fetch).mockResolvedValue({
            ok: false,
            json: async () => body,
        } as Response);
    }

    it('returns the id on success', async () => {
        mockOk({ id: 'abc123' });
        expect(await submitFeedback('key', 'feedback text here', null)).toEqual({ id: 'abc123' });
    });

    it('posts to the correct URL', async () => {
        mockOk({ id: '1' });
        await submitFeedback('key', 'feedback text here', null);
        expect(vi.mocked(fetch).mock.calls[0][0]).toBe('https://inputbuffer.io/api/v0/inputs');
    });

    it('uses apiUrl when provided', async () => {
        mockOk({ id: '1' });
        await submitFeedback('key', 'feedback text here', null, undefined, 'http://localhost:3000/api/widget/inputs');
        expect(vi.mocked(fetch).mock.calls[0][0]).toBe('http://localhost:3000/api/widget/inputs');
    });

    it('sets Authorization and Content-Type headers', async () => {
        mockOk({ id: '1' });
        await submitFeedback('my-key', 'feedback text here', null);
        const headers = (vi.mocked(fetch).mock.calls[0][1] as RequestInit).headers as Record<string, string>;
        expect(headers['Authorization']).toBe('Bearer my-key');
        expect(headers['Content-Type']).toBe('application/json');
    });

    it('includes X-IB-Client header with version', async () => {
        mockOk({ id: '1' });
        await submitFeedback('key', 'feedback text here', null);
        const headers = (vi.mocked(fetch).mock.calls[0][1] as RequestInit).headers as Record<string, string>;
        expect(headers['X-IB-Client']).toContain(WIDGET_VERSION);
    });

    it('sets title and description in body', async () => {
        mockOk({ id: '1' });
        await submitFeedback('key', 'my feedback text', null);
        const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string);
        expect(body.title).toBe('Widget feedback');
        expect(body.description).toBe('my feedback text');
    });

    it('omits contactEmail when email is null', async () => {
        mockOk({ id: '1' });
        await submitFeedback('key', 'feedback text here', null);
        const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string);
        expect(body.contactEmail).toBeUndefined();
    });

    it('includes contactEmail when provided', async () => {
        mockOk({ id: '1' });
        await submitFeedback('key', 'feedback text here', 'user@example.com');
        const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string);
        expect(body.contactEmail).toBe('user@example.com');
    });

    it('includes targets when target option is provided', async () => {
        mockOk({ id: '1' });
        await submitFeedback('key', 'feedback text here', null, {
            target: { type: 'documentation', metadata: { page: '/docs' } },
        });
        const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string);
        expect(body.targets).toEqual([{ target_type: 'documentation', metadata: { page: '/docs' } }]);
    });

    it('omits targets when no target option', async () => {
        mockOk({ id: '1' });
        await submitFeedback('key', 'feedback text here', null);
        const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string);
        expect(body.targets).toBeUndefined();
    });

    it('throws the API error message on non-ok response', async () => {
        mockError({ error: { message: 'Unauthorized' } });
        await expect(submitFeedback('bad-key', 'feedback text here', null)).rejects.toThrow('Unauthorized');
    });

    it('throws fallback message when error body is unparseable', async () => {
        vi.mocked(fetch).mockResolvedValue({
            ok: false,
            json: async () => { throw new Error('bad json'); },
        } as unknown as Response);
        await expect(submitFeedback('key', 'feedback text here', null)).rejects.toThrow('Submission failed. Please try again.');
    });
});
