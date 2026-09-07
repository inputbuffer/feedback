import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitFeedback, submitReaction, WIDGET_VERSION } from './api.js';
import { ApiError } from './types.js';
import type { TargetSpec } from './types.js';

function mockOk(body: unknown) {
    vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => body,
    } as Response);
}

function mockError(body: unknown, status = 400) {
    vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status,
        json: async () => body,
    } as Response);
}

function calledUrl(): string {
    return vi.mocked(fetch).mock.calls[0][0] as string;
}

function calledInit(): RequestInit {
    return vi.mocked(fetch).mock.calls[0][1] as RequestInit;
}

function calledBody(): Record<string, unknown> {
    return JSON.parse(calledInit().body as string);
}

const DOC_TARGET: TargetSpec = { type: 'documentation', metadata: { page_url: '/docs' } };

describe('submitFeedback', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    it('returns the id on success', async () => {
        mockOk({ data: { id: 'abc123' } });
        expect(await submitFeedback('key', 'feedback text here', null)).toEqual({ id: 'abc123' });
    });

    it('posts to the feedback endpoint by default', async () => {
        mockOk({ data: { id: '1' } });
        await submitFeedback('key', 'feedback text here', null);
        expect(calledUrl()).toBe('https://inputbuffer.io/api/v0/feedback');
    });

    it('treats apiUrl as a base origin', async () => {
        mockOk({ data: { id: '1' } });
        await submitFeedback('key', 'feedback text here', null, undefined, 'http://localhost:8080');
        expect(calledUrl()).toBe('http://localhost:8080/api/v0/feedback');
    });

    it('normalizes a trailing slash on apiUrl', async () => {
        mockOk({ data: { id: '1' } });
        await submitFeedback('key', 'feedback text here', null, undefined, 'http://localhost:8080/');
        expect(calledUrl()).toBe('http://localhost:8080/api/v0/feedback');
    });

    it('POSTs without credentials', async () => {
        mockOk({ data: { id: '1' } });
        await submitFeedback('key', 'feedback text here', null);
        expect(calledInit().method).toBe('POST');
        expect(calledInit().credentials).toBe('omit');
    });

    it('sets Authorization and Content-Type headers', async () => {
        mockOk({ data: { id: '1' } });
        await submitFeedback('my-key', 'feedback text here', null);
        const headers = calledInit().headers as Record<string, string>;
        expect(headers['Authorization']).toBe('Bearer my-key');
        expect(headers['Content-Type']).toBe('application/json');
    });

    it('includes X-IB-Client header with version', async () => {
        mockOk({ data: { id: '1' } });
        await submitFeedback('key', 'feedback text here', null);
        const headers = calledInit().headers as Record<string, string>;
        expect(headers['X-IB-Client']).toBe(`inputbuffer-widget/${WIDGET_VERSION} (javascript)`);
    });

    it('omits title from body when not provided', async () => {
        mockOk({ data: { id: '1' } });
        await submitFeedback('key', 'my feedback text', null);
        expect(calledBody().title).toBeUndefined();
        expect(calledBody().description).toBe('my feedback text');
    });

    it('includes title in body when provided', async () => {
        mockOk({ data: { id: '1' } });
        await submitFeedback('key', 'my feedback text', 'My title');
        expect(calledBody().title).toBe('My title');
    });

    it('omits submitted_by when not provided', async () => {
        mockOk({ data: { id: '1' } });
        await submitFeedback('key', 'feedback text here', null);
        expect(calledBody().submitted_by).toBeUndefined();
    });

    it('includes submitted_by when provided', async () => {
        mockOk({ data: { id: '1' } });
        await submitFeedback('key', 'feedback text here', null, { submittedBy: 'user_12345' });
        expect(calledBody().submitted_by).toBe('user_12345');
    });

    it('truncates fields to the API maxLengths', async () => {
        mockOk({ data: { id: '1' } });
        await submitFeedback('key', 'd'.repeat(6000), 't'.repeat(600), {
            submittedBy: 'u'.repeat(400),
        });
        const body = calledBody();
        expect((body.description as string).length).toBe(5000);
        expect((body.title as string).length).toBe(500);
        expect((body.submitted_by as string).length).toBe(300);
    });

    it('never sends the removed contact_email or source fields', async () => {
        mockOk({ data: { id: '1' } });
        await submitFeedback('key', 'feedback text here', null, {
            submittedBy: 'user@example.com',
            target: DOC_TARGET,
        });
        const body = calledBody();
        expect(body.contact_email).toBeUndefined();
        expect(body.source).toBeUndefined();
    });

    it('does not send sentiment, which the feedback API has no field for', async () => {
        mockOk({ data: { id: '1' } });
        await submitFeedback('key', 'feedback text here', null, { sentiment: 'positive' });
        expect(calledBody().sentiment).toBeUndefined();
    });

    it('includes targets when target option is provided', async () => {
        mockOk({ data: { id: '1' } });
        await submitFeedback('key', 'feedback text here', null, { target: DOC_TARGET });
        expect(calledBody().targets).toEqual([{ type: 'documentation', metadata: { page_url: '/docs' } }]);
    });

    it('omits targets when no target option', async () => {
        mockOk({ data: { id: '1' } });
        await submitFeedback('key', 'feedback text here', null);
        expect(calledBody().targets).toBeUndefined();
    });

    it('throws ApiError with problem details on non-ok response', async () => {
        mockError({
            type: 'https://inputbuffer.io/docs/api/problems/widget-token-restricted',
            title: 'Widget Token Restricted',
            detail: 'A full-access token cannot be used from a browser.',
            status: 403,
            category: 'integration',
        }, 403);
        const err = await submitFeedback('ib_bad-key', 'feedback text here', null).catch(e => e);
        expect(err).toBeInstanceOf(ApiError);
        expect(err.type).toBe('https://inputbuffer.io/docs/api/problems/widget-token-restricted');
        expect(err.title).toBe('Widget Token Restricted');
        expect(err.status).toBe(403);
        expect(err.category).toBe('integration');
        expect(err.message).toBe('A full-access token cannot be used from a browser.');
    });

    it('throws ApiError with field when missing-required-field', async () => {
        mockError({
            type: 'https://inputbuffer.io/docs/api/problems/missing-required-field',
            title: 'Missing Required Field',
            detail: 'description is required.',
            status: 422,
            category: 'user',
            field: 'description',
        }, 422);
        const err = await submitFeedback('key', 'feedback text here', null).catch(e => e);
        expect(err).toBeInstanceOf(ApiError);
        expect(err.field).toBe('description');
        expect(err.category).toBe('user');
    });

    it('throws ApiError with fallback values when error body is unparseable', async () => {
        vi.mocked(fetch).mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => { throw new Error('bad json'); },
        } as unknown as Response);
        const err = await submitFeedback('key', 'feedback text here', null).catch(e => e);
        expect(err).toBeInstanceOf(ApiError);
        expect(err.type).toBe('https://inputbuffer.io/docs/api/problems/internal-error');
        expect(err.detail).toBe('Submission failed. Please try again.');
        expect(err.status).toBe(500);
    });
});

describe('submitReaction', () => {
    const reaction = {
        id: 'rx_1',
        target: { id: 'tg_1', type: 'documentation', display_name: '/docs', metadata: { page_url: '/docs' } },
        reaction_value: 1,
        created_at: '2026-05-12T14:30:00Z',
    };

    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    it('posts to the reactions endpoint by default', async () => {
        mockOk({ data: reaction });
        await submitReaction('key', 1, DOC_TARGET);
        expect(calledUrl()).toBe('https://inputbuffer.io/api/v0/reactions');
    });

    it('derives the reactions URL from the apiUrl base', async () => {
        mockOk({ data: reaction });
        await submitReaction('key', 1, DOC_TARGET, null, 'http://localhost:8080');
        expect(calledUrl()).toBe('http://localhost:8080/api/v0/reactions');
    });

    it('sends a singular target and the numeric reaction value', async () => {
        mockOk({ data: reaction });
        await submitReaction('key', -1, DOC_TARGET);
        expect(calledBody()).toEqual({
            reaction_value: -1,
            target: { type: 'documentation', metadata: { page_url: '/docs' } },
        });
    });

    it('includes user_id when provided', async () => {
        mockOk({ data: reaction });
        await submitReaction('key', 1, DOC_TARGET, 'user_12345');
        expect(calledBody().user_id).toBe('user_12345');
    });

    it('omits user_id when null', async () => {
        mockOk({ data: reaction });
        await submitReaction('key', 1, DOC_TARGET, null);
        expect(calledBody().user_id).toBeUndefined();
    });

    it('returns the resolved target from the response', async () => {
        mockOk({ data: reaction });
        const result = await submitReaction('key', 1, DOC_TARGET);
        expect(result.target.id).toBe('tg_1');
        expect(result.reaction_value).toBe(1);
    });

    it('throws ApiError on a non-ok response', async () => {
        mockError({
            type: 'https://inputbuffer.io/docs/api/problems/forbidden-origin',
            title: 'Forbidden Origin',
            detail: 'This origin is not allowlisted for this token.',
            status: 403,
            category: 'integration',
        }, 403);
        const err = await submitReaction('key', 1, DOC_TARGET).catch(e => e);
        expect(err).toBeInstanceOf(ApiError);
        expect(err.type).toBe('https://inputbuffer.io/docs/api/problems/forbidden-origin');
    });

    it('warns about the missing userId when the API rejects an unattributable reaction', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        mockError({
            type: 'https://inputbuffer.io/docs/api/problems/missing-required-field',
            title: 'Missing Required Field',
            detail: 'user_id is required when no client IP is available.',
            status: 422,
            category: 'integration',
            field: 'user_id',
        }, 422);

        await submitReaction('key', 1, DOC_TARGET).catch(() => {});

        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('userId'),
            expect.anything()
        );
        warn.mockRestore();
    });
});
