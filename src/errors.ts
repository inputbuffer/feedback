import { ApiError } from './types.js';

const GENERIC_MESSAGE = 'Something went wrong. Please try again.';

/**
 * Picks the message to show the person filling in the form.
 *
 * `category: 'user'` means they sent something the API rejected (a too-long field, too many
 * requests), so `detail` is written for them. `category: 'integration'` means the embed is
 * misconfigured — a full-access token in a browser, an origin that isn't allowlisted, an
 * exhausted plan. Showing that to an end user is noise, but swallowing it leaves the developer
 * with no way to diagnose the form, so it goes to the console instead.
 */
export function userFacingMessage(err: unknown): string {
    if (!(err instanceof ApiError)) return GENERIC_MESSAGE;

    if (err.category === 'user') return err.detail;

    if (err.category === 'integration') {
        warn(`${err.title}: ${err.detail}`, err.type);
    }

    return GENERIC_MESSAGE;
}

export function warn(message: string, detail?: string): void {
    if (typeof console === 'undefined') return;
    console.warn(`[inputbuffer] ${message}`, detail ?? '');
}
