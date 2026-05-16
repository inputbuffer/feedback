import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitFeedback, WIDGET_VERSION } from './api.js';
import { ApiError } from './types.js';

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
        mockOk({ data: { id: 'abc123' } });
        expect(await submitFeedback('key', 'feedback text here', null, null)).toEqual({ id: 'abc123' });
    });

    it('posts to the correct URL', async () => {
        mockOk({ data: { id: '1' } });
        await submitFeedback('key', 'feedback text here', null, null);
        expect(vi.mocked(fetch).mock.calls[0][0]).toBe('https://inputbuffer.io/api/v0/inputs');
    });

    it('uses apiUrl when provided', async () => {
        mockOk({ data: { id: '1' } });
        await submitFeedback('key', 'feedback text here', null, null, undefined, 'http://localhost:3000/api/widget/inputs');
        expect(vi.mocked(fetch).mock.calls[0][0]).toBe('http://localhost:3000/api/widget/inputs');
    });

    it('sets Authorization and Content-Type headers', async () => {
        mockOk({ data: { id: '1' } });
        await submitFeedback('my-key', 'feedback text here', null, null);
        const headers = (vi.mocked(fetch).mock.calls[0][1] as RequestInit).headers as Record<string, string>;
        expect(headers['Authorization']).toBe('Bearer my-key');
        expect(headers['Content-Type']).toBe('application/json');
    });

    it('includes X-IB-Client header with version', async () => {
        mockOk({ data: { id: '1' } });
        await submitFeedback('key', 'feedback text here', null, null);
        const headers = (vi.mocked(fetch).mock.calls[0][1] as RequestInit).headers as Record<string, string>;
        expect(headers['X-IB-Client']).toContain(WIDGET_VERSION);
    });

    it('omits title from body when not provided', async () => {
        mockOk({ data: { id: '1' } });
        await submitFeedback('key', 'my feedback text', null, null);
        const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string);
        expect(body.title).toBeUndefined();
        expect(body.description).toBe('my feedback text');
    });

    it('includes title in body when provided', async () => {
        mockOk({ data: { id: '1' } });
        await submitFeedback('key', 'my feedback text', null, 'My title');
        const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string);
        expect(body.title).toBe('My title');
    });

    it('omits contact_email when email is null', async () => {
        mockOk({ data: { id: '1' } });
        await submitFeedback('key', 'feedback text here', null, null);
        const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string);
        expect(body.contact_email).toBeUndefined();
    });

    it('includes contact_email when provided', async () => {
        mockOk({ data: { id: '1' } });
        await submitFeedback('key', 'feedback text here', 'user@example.com', null);
        const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string);
        expect(body.contact_email).toBe('user@example.com');
    });

    it('includes targets when target option is provided', async () => {
        mockOk({ data: { id: '1' } });
        await submitFeedback('key', 'feedback text here', null, null, {
            target: { type: 'documentation', metadata: { page_url: '/docs' } },
        });
        const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string);
        expect(body.targets).toEqual([{ type: 'documentation', metadata: { page_url: '/docs' } }]);
    });

    it('omits targets when no target option', async () => {
        mockOk({ data: { id: '1' } });
        await submitFeedback('key', 'feedback text here', null, null);
        const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string);
        expect(body.targets).toBeUndefined();
    });

    it('throws ApiError with problem details on non-ok response', async () => {
        mockError({
            type: 'https://inputbuffer.io/problems/unauthorized',
            title: 'Unauthorized',
            detail: 'Invalid or expired token.',
            status: 401,
            category: 'config',
        });
        const err = await submitFeedback('bad-key', 'feedback text here', null, null).catch(e => e);
        expect(err).toBeInstanceOf(ApiError);
        expect(err.type).toBe('https://inputbuffer.io/problems/unauthorized');
        expect(err.status).toBe(401);
        expect(err.detail).toBe('Invalid or expired token.');
        expect(err.category).toBe('config');
        expect(err.message).toBe('Invalid or expired token.');
    });

    it('throws ApiError with field when missing-required-field', async () => {
        mockError({
            type: 'https://inputbuffer.io/problems/missing-required-field',
            title: 'Missing Required Field',
            detail: 'description is required.',
            status: 422,
            category: 'config',
            field: 'description',
        });
        const err = await submitFeedback('key', 'feedback text here', null, null).catch(e => e);
        expect(err).toBeInstanceOf(ApiError);
        expect(err.field).toBe('description');
    });

    it('throws ApiError with fallback values when error body is unparseable', async () => {
        vi.mocked(fetch).mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => { throw new Error('bad json'); },
        } as unknown as Response);
        const err = await submitFeedback('key', 'feedback text here', null, null).catch(e => e);
        expect(err).toBeInstanceOf(ApiError);
        expect(err.detail).toBe('Submission failed. Please try again.');
        expect(err.status).toBe(500);
    });
});
