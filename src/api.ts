import { ApiError } from './types.js';
import type { OpenOptions, ProblemDetails, ReactionResult, TargetSpec } from './types.js';
import { warn } from './errors.js';

declare const __WIDGET_VERSION__: string;
export const WIDGET_VERSION = __WIDGET_VERSION__;

const DEFAULT_API_BASE = 'https://inputbuffer.io';
const FEEDBACK_PATH = '/api/v0/feedback';
const REACTIONS_PATH = '/api/v0/reactions';

const TIMEOUT_MS = 10_000;

// Matches the maxLength on each field in the API's FeedbackCreate schema. Trimming here turns
// what would be a 422 into a slightly shorter submission.
const MAX_DESCRIPTION = 5000;
const MAX_TITLE = 500;
const MAX_SUBMITTED_BY = 300;

/** `apiUrl` is a base origin (`https://inputbuffer.io`); the paths are ours to append. */
function endpoint(base: string | undefined, path: string): string {
    return `${(base ?? DEFAULT_API_BASE).replace(/\/+$/, '')}${path}`;
}

async function request(url: string, apiKey: string, body: unknown): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let res: Response;
    try {
        res = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'X-IB-Client': `inputbuffer-widget/${WIDGET_VERSION} (javascript)`,
            },
            body: JSON.stringify(body),
            credentials: 'omit',
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timeoutId);
    }

    if (!res.ok) {
        const problem: Partial<ProblemDetails> = await res.json().catch(() => ({}));
        throw new ApiError({
            type: problem.type ?? 'https://inputbuffer.io/docs/api/problems/internal-error',
            title: problem.title ?? 'Error',
            detail: problem.detail ?? 'Submission failed. Please try again.',
            status: problem.status ?? res.status,
            category: problem.category,
            field: problem.field,
        });
    }

    return res;
}

export async function submitFeedback(
    apiKey: string,
    description: string,
    title: string | null,
    options?: OpenOptions,
    apiUrl?: string
): Promise<{ id: string }> {
    // `options.sentiment` is deliberately absent: the feedback API has no sentiment field.
    // Thumb selections are recorded through submitReaction instead.
    const body: Record<string, unknown> = { description: description.slice(0, MAX_DESCRIPTION) };

    if (title) body.title = title.slice(0, MAX_TITLE);

    if (options?.submittedBy) body.submitted_by = options.submittedBy.slice(0, MAX_SUBMITTED_BY);

    if (options?.target) {
        const t = options.target;
        body.targets = [{ type: t.type, metadata: t.metadata }];
    }

    const res = await request(endpoint(apiUrl, FEEDBACK_PATH), apiKey, body);
    const { data } = await res.json() as { data: { id: string } };
    return { id: data.id };
}

export async function submitReaction(
    apiKey: string,
    reactionValue: 1 | -1,
    target: TargetSpec,
    userId?: string | null,
    apiUrl?: string
): Promise<ReactionResult> {
    const body: Record<string, unknown> = {
        reaction_value: reactionValue,
        target: { type: target.type, metadata: target.metadata },
    };
    if (userId) body.user_id = userId;

    let res: Response;
    try {
        res = await request(endpoint(apiUrl, REACTIONS_PATH), apiKey, body);
    } catch (err) {
        // With neither a user_id nor a client IP the API has nobody to attribute the reaction
        // to. Only the embedder can fix that, and reactions are fire-and-forget, so this would
        // otherwise vanish silently.
        if (err instanceof ApiError && err.status === 422 && err.field === 'user_id') {
            warn('Reaction rejected: no user_id and no client IP. Set the `userId` option (or the `user-id` attribute).');
        }
        throw err;
    }

    const { data } = await res.json() as { data: ReactionResult };
    return data;
}
