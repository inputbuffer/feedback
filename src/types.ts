interface BaseTargetSpec {
    targetId?: string;
    displayName?: string;
}

export interface RestEndpointTarget extends BaseTargetSpec {
    type: 'rest_endpoint';
    metadata?: {
        method?: string;
        path?: string;
        host: string;
        api_version: string;
    };
}

export interface DocumentationTarget extends BaseTargetSpec {
    type: 'documentation';
    metadata?: {
        page_url?: string;
        page_slug?: string;
        section_heading?: string;
        doc_version?: string;
    };
}

export interface CliCommandTarget extends BaseTargetSpec {
    type: 'cli_command';
    metadata?: {
        command?: string;
        subcommand?: string;
        cli_version?: string;
    };
}

export type TargetSpec = RestEndpointTarget | DocumentationTarget | CliCommandTarget;

export interface OpenOptions {
    target?: TargetSpec;
    prefill?: {
        email?: string;
        description?: string;
    };
    title?: string;
    sentiment?: 'positive' | 'negative';
    source?: string;
}

export interface FeedbackBarConfig {
    apiKey: string;
    apiUrl?: string;
    label?: string;
    showLabel?: boolean;
    placement?: 'fixed' | 'inline';
    colorScheme?: 'dark' | 'light' | 'auto';
    theme?: WidgetConfig['theme'];
    target?: TargetSpec;
    modalTitle?: string;
    modalPlaceholder?: string;
    showEmailField?: boolean;
    showTitleField?: boolean;
    injectStyles?: boolean;
    source?: string;
    userId?: string;
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
    showTitleField?: boolean;
    showSentiment?: boolean;
    source?: string;
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
