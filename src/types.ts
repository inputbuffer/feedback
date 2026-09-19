/**
 * The problem type URIs the API can return. The spec is explicit that these are stable
 * across releases and that clients should switch on `type` rather than `status`, because
 * several types share a status code.
 */
export type ProblemType =
    | 'https://inputbuffer.io/docs/api/problems/unauthorized'
    | 'https://inputbuffer.io/docs/api/problems/invalid-token-format'
    | 'https://inputbuffer.io/docs/api/problems/invalid-token'
    | 'https://inputbuffer.io/docs/api/problems/forbidden'
    | 'https://inputbuffer.io/docs/api/problems/forbidden-origin'
    | 'https://inputbuffer.io/docs/api/problems/widget-token-restricted'
    | 'https://inputbuffer.io/docs/api/problems/admin-required'
    | 'https://inputbuffer.io/docs/api/problems/org-required'
    | 'https://inputbuffer.io/docs/api/problems/feedback-not-found'
    | 'https://inputbuffer.io/docs/api/problems/buffer-not-found'
    | 'https://inputbuffer.io/docs/api/problems/target-not-found'
    | 'https://inputbuffer.io/docs/api/problems/member-not-found'
    | 'https://inputbuffer.io/docs/api/problems/research-query-not-found'
    | 'https://inputbuffer.io/docs/api/problems/missing-required-field'
    | 'https://inputbuffer.io/docs/api/problems/invalid-field-value'
    | 'https://inputbuffer.io/docs/api/problems/unsupported-media-type'
    | 'https://inputbuffer.io/docs/api/problems/rate-limited'
    | 'https://inputbuffer.io/docs/api/problems/usage-limit-reached'
    | 'https://inputbuffer.io/docs/api/problems/conflict'
    | 'https://inputbuffer.io/docs/api/problems/internal-error';

/**
 * RFC 7807 Problem Details, returned by every API error with
 * `Content-Type: application/problem+json`.
 */
export interface ProblemDetails {
    /** Widened to `string` because a future release may add a type this version doesn't know. */
    type: ProblemType | (string & {});
    title: string;
    detail: string;
    status: number;
    /**
     * Who caused the problem. `user` means the person filling in the form sent something the
     * API rejected, so `detail` is safe to show them. `integration` means the embed itself is
     * misconfigured, so show something generic and surface `detail` to the developer.
     * Omitted on `internal-error`.
     */
    category?: 'user' | 'integration';
    /** Present only on `missing-required-field` and `invalid-field-value`. */
    field?: string;
}

export class ApiError extends Error {
    type: ProblemType | (string & {});
    title: string;
    status: number;
    detail: string;
    category?: 'user' | 'integration';
    field?: string;

    constructor(problem: ProblemDetails) {
        super(problem.detail);
        this.name = 'ApiError';
        this.type = problem.type;
        this.title = problem.title;
        this.status = problem.status;
        this.detail = problem.detail;
        this.category = problem.category;
        this.field = problem.field;
    }
}

export interface RestEndpointTarget {
    type: 'rest_endpoint';
    metadata: {
        method: string;
        path: string;
        host?: string;
        api_version?: string;
    };
}

export interface DocumentationTarget {
    type: 'documentation';
    metadata: {
        page_url: string;
        section_heading?: string;
        doc_version?: string;
    };
}

export interface CliCommandTarget {
    type: 'cli_command';
    metadata: {
        command: string;
        subcommand?: string;
        cli_version?: string;
        args?: string[];
    };
}

export type TargetSpec = RestEndpointTarget | DocumentationTarget | CliCommandTarget;

/** A target as the API echoes it back, resolved to a stored record with an id. */
export interface TargetRef {
    id: string;
    type: TargetSpec['type'];
    display_name: string;
    metadata: TargetSpec['metadata'];
}

/** The reaction the API recorded, including the target it resolved or created. */
export interface ReactionResult {
    id: string;
    target: TargetRef;
    reaction_value: 1 | -1;
    created_at: string;
}

export interface OpenOptions {
    target?: TargetSpec;
    prefill?: {
        description?: string;
    };
    title?: string;
    /**
     * Drives the thumb selection in the UI only. The feedback API has no sentiment field,
     * so this is never sent; thumbs are recorded through the reactions API instead.
     */
    sentiment?: 'positive' | 'negative';
    /** Overrides the widget-level `submittedBy` for this submission. */
    submittedBy?: string;
}

export interface FeedbackBarConfig {
    apiKey: string;
    apiUrl?: string;
    label?: string;
    showLabel?: boolean;
    /**
     * Thumbs up/down. When `false` the label area becomes a single button that opens the
     * follow-up form with no sentiment, and no reaction is ever recorded. An explicit
     * `showLabel: false` is ignored in that case, because the label is the only trigger left.
     */
    showThumbs?: boolean;
    placement?: 'fixed' | 'inline';
    colorScheme?: 'dark' | 'light' | 'auto';
    theme?: WidgetConfig['theme'];
    target?: TargetSpec;
    modalTitle?: string;
    modalPlaceholder?: string;
    showTitleField?: boolean;
    injectStyles?: boolean;
    /** Opaque identifier for whoever submits feedback. Sent as `submitted_by`. */
    submittedBy?: string;
    /** Stable end-user id used to deduplicate reactions. Sent as `user_id`. */
    userId?: string;
}

export interface FeedbackBarInstance {
    element: HTMLElement;
    on(event: 'vote', handler: (payload: { sentiment: 'positive' | 'negative' }) => void): void;
    /** `sentiment` is absent when the popover was opened by the label trigger or a bare `open()`. */
    on(event: 'open', handler: (payload: { sentiment?: 'positive' | 'negative' }) => void): void;
    on(event: 'submit', handler: (payload: { id: string }) => void): void;
    on(event: 'error', handler: (err: Error) => void): void;
    on(event: 'close', handler: () => void): void;
    /**
     * Opens the follow-up form. Purely a display action: it never records a reaction, writes to
     * `localStorage`, or emits `vote`. Passing a sentiment selects that thumb; omitting it keeps
     * whatever is already selected.
     */
    open(sentiment?: 'positive' | 'negative'): void;
    close(): void;
    destroy(): void;
}

export interface WidgetConfig {
    apiKey: string;
    apiUrl?: string;
    colorScheme?: 'dark' | 'light' | 'auto';
    theme?: {
        primary?: string;
        background?: string;
        surface?: string;
        text?: string;
        selected?: string;
        selectedColor?: string;
    };
    attachTo?: string;
    injectStyles?: boolean;
    title?: string;
    placeholder?: string;
    showTitleField?: boolean;
    showSentiment?: boolean;
    /** Opaque identifier for whoever submits feedback. Sent as `submitted_by`. */
    submittedBy?: string;
}

export interface WidgetInstance {
    open(options?: OpenOptions): void;
    close(): void;
    on(
        event: 'submit' | 'close' | 'error',
        handler: ((result: { id: string }) => void) | (() => void) | ((err: Error) => void)
    ): void;
    destroy(): void;
}
