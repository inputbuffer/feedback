import { ApiError } from './types.js';
import type { OpenOptions, ProblemDetails, TargetSpec } from './types.js';

declare const __WIDGET_VERSION__: string;
export const WIDGET_VERSION = __WIDGET_VERSION__;

const DEFAULT_API_URL = 'https://inputbuffer.io/api/v0/inputs';

export async function submitFeedback(
    apiKey: string,
    description: string,
    email: string | null,
    title: string | null,
    options?: OpenOptions,
    apiUrl?: string
): Promise<{ id: string }> {
    const body: Record<string, unknown> = { description };

    if (title) body.title = title;

    if (email) {
        body.contact_email = email;
    }

    if (options?.source) {
        body.source = options.source;
    }

    if (options?.target) {
        const t = options.target;
        body.targets = [{ type: t.type, metadata: t.metadata }];
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);
    let res: Response;
    try {
        res = await fetch(apiUrl ?? DEFAULT_API_URL, {
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
            type: problem.type ?? 'https://inputbuffer.io/problems/internal-error',
            title: problem.title ?? 'Error',
            detail: problem.detail ?? 'Submission failed. Please try again.',
            status: problem.status ?? res.status,
            category: problem.category,
            field: problem.field,
        });
    }

    const { data } = await res.json() as { data: { id: string } };
    return { id: data.id };
}

const DEFAULT_REACTIONS_URL = 'https://inputbuffer.io/api/v0/reactions';

export async function submitReaction(
    apiKey: string,
    reactionValue: 1 | -1,
    target: TargetSpec,
    userId?: string | null,
    apiUrl?: string
): Promise<void> {
    const url = apiUrl ? apiUrl.replace(/\/inputs$/, '/reactions') : DEFAULT_REACTIONS_URL;

    const body: Record<string, unknown> = {
        reaction_value: reactionValue,
        target: { type: target.type, metadata: target.metadata },
    };
    if (userId) body.user_id = userId;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);
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
            type: problem.type ?? 'https://inputbuffer.io/problems/internal-error',
            title: problem.title ?? 'Error',
            detail: problem.detail ?? 'Submission failed. Please try again.',
            status: problem.status ?? res.status,
            category: problem.category,
            field: problem.field,
        });
    }
}
