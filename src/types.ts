export interface TargetSpec {
    type: 'documentation' | 'rest_endpoint' | 'cli_command';
    metadata?: Record<string, string>;
}

export interface OpenOptions {
    target?: TargetSpec;
    prefill?: {
        email?: string;
        description?: string;
    };
    title?: string;
    sentiment?: 'positive' | 'negative';
}

export interface FeedbackBarConfig {
    apiKey: string;
    apiUrl?: string;
    label?: string;
    showLabel?: boolean;
    placement?: 'fixed' | 'inline';
    colorScheme?: 'dark' | 'light' | 'auto';
    theme?: WidgetConfig['theme'];
    modalTitle?: string;
    modalPlaceholder?: string;
    showEmailField?: boolean;
    injectStyles?: boolean;
}

export interface FeedbackBarInstance {
    element: HTMLElement;
    on(event: 'vote' | 'open', handler: (payload: { sentiment: 'positive' | 'negative' }) => void): void;
    on(event: 'submit', handler: (payload: { id: string }) => void): void;
    on(event: 'error', handler: (err: Error) => void): void;
    on(event: 'close', handler: () => void): void;
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
    showEmailField?: boolean;
    showSentiment?: boolean;
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
