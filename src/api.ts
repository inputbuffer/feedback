import type { OpenOptions, TargetSpec } from './types.js';

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
        body.contactEmail = email;
    }

    if (options?.sentiment) {
        body.sentiment = options.sentiment;
    }

    if (options?.source) {
        body.source = options.source;
    }

    if (options?.target) {
        const t = options.target;
        body.targets = [{
            target_type: t.type,
            ...(t.targetId    && { target_id:    t.targetId }),
            ...(t.displayName && { display_name: t.displayName }),
            metadata: t.metadata,
        }];
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
        const data: { error?: { message?: string } } = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message || 'Submission failed. Please try again.');
    }

    return res.json() as Promise<{ id: string }>;
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
        target: {
            type: target.type,
            ...(target.targetId    && { target_id:    target.targetId }),
            ...(target.displayName && { display_name: target.displayName }),
            metadata: target.metadata,
        },
    };
    if (userId) body.user_id = userId;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);
    try {
        await fetch(url, {
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
}
