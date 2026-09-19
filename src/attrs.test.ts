import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { barConfigFromElement, modalConfigFromScript, shouldInjectStyles, targetFromAttributes } from './attrs.js';

function element(attrs: Record<string, string>): HTMLElement {
    const el = document.createElement('inputbuffer-feedback');
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
}

function script(dataset: Record<string, string>): HTMLScriptElement {
    const el = document.createElement('script');
    for (const [k, v] of Object.entries(dataset)) el.setAttribute(`data-${k}`, v);
    return el;
}

describe('barConfigFromElement', () => {
    it('reads every documented attribute', () => {
        const config = barConfigFromElement(element({
            'api-url': 'http://localhost:8080',
            'label': 'Was this helpful?',
            'show-label': 'false',
            'show-thumbs': 'false',
            'placement': 'fixed',
            'color-scheme': 'dark',
            'modal-title': 'Tell us more',
            'modal-placeholder': 'What went wrong?',
            'show-title-field': 'true',
            'submitted-by': 'user_12345',
            'user-id': 'user_12345',
            'theme-primary': '#ff0000',
            'theme-selected-color': '#ffffff',
        }), 'ibw_key');

        expect(config).toMatchObject({
            apiKey: 'ibw_key',
            apiUrl: 'http://localhost:8080',
            label: 'Was this helpful?',
            showLabel: false,
            showThumbs: false,
            placement: 'fixed',
            colorScheme: 'dark',
            modalTitle: 'Tell us more',
            modalPlaceholder: 'What went wrong?',
            showTitleField: true,
            submittedBy: 'user_12345',
            userId: 'user_12345',
        });
        expect(config.theme?.primary).toBe('#ff0000');
        expect(config.theme?.selectedColor).toBe('#ffffff');
    });

    it('leaves absent booleans undefined so component defaults apply', () => {
        const config = barConfigFromElement(element({}), 'ibw_key');
        expect(config.showLabel).toBeUndefined();
        expect(config.showThumbs).toBeUndefined();
        expect(config.showTitleField).toBeUndefined();
    });

    it('defaults placement to inline', () => {
        expect(barConfigFromElement(element({}), 'ibw_key').placement).toBe('inline');
        expect(barConfigFromElement(element({ placement: 'nonsense' }), 'ibw_key').placement).toBe('inline');
    });
});

describe('shouldInjectStyles', () => {
    it('injects unless explicitly disabled', () => {
        expect(shouldInjectStyles(element({}))).toBe(true);
        expect(shouldInjectStyles(element({ 'inject-styles': 'true' }))).toBe(true);
        expect(shouldInjectStyles(element({ 'inject-styles': 'false' }))).toBe(false);
    });
});

describe('targetFromAttributes', () => {
    let warn: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        warn.mockRestore();
    });

    it('returns undefined when no target-type is set', () => {
        expect(targetFromAttributes(element({}))).toBeUndefined();
        expect(warn).not.toHaveBeenCalled();
    });

    it('builds a documentation target', () => {
        expect(targetFromAttributes(element({
            'target-type': 'documentation',
            'target-page-url': 'https://docs.example.com/guide/auth',
            'target-section-heading': 'Rotating tokens',
            'target-doc-version': '2.1',
        }))).toEqual({
            type: 'documentation',
            metadata: {
                page_url: 'https://docs.example.com/guide/auth',
                section_heading: 'Rotating tokens',
                doc_version: '2.1',
            },
        });
    });

    it('defaults a documentation page_url to the current page', () => {
        const target = targetFromAttributes(element({ 'target-type': 'documentation' }));
        expect(target).toEqual({
            type: 'documentation',
            metadata: {
                page_url: window.location.href,
                section_heading: undefined,
                doc_version: undefined,
            },
        });
    });

    it('builds a rest_endpoint target', () => {
        expect(targetFromAttributes(element({
            'target-type': 'rest_endpoint',
            'target-method': 'GET',
            'target-path': '/users/{id}',
            'target-host': 'api.example.com',
            'target-api-version': 'v1',
        }))).toEqual({
            type: 'rest_endpoint',
            metadata: {
                method: 'GET',
                path: '/users/{id}',
                host: 'api.example.com',
                api_version: 'v1',
            },
        });
    });

    it('drops a rest_endpoint target missing a required field', () => {
        expect(targetFromAttributes(element({
            'target-type': 'rest_endpoint',
            'target-method': 'GET',
        }))).toBeUndefined();
        expect(warn).toHaveBeenCalled();
    });

    it('builds a cli_command target and splits args', () => {
        expect(targetFromAttributes(element({
            'target-type': 'cli_command',
            'target-command': 'deploy',
            'target-subcommand': 'container run',
            'target-cli-version': '3.4.0',
            'target-args': '--rm, --network',
        }))).toEqual({
            type: 'cli_command',
            metadata: {
                command: 'deploy',
                subcommand: 'container run',
                cli_version: '3.4.0',
                args: ['--rm', '--network'],
            },
        });
    });

    it('drops a cli_command target missing a command', () => {
        expect(targetFromAttributes(element({ 'target-type': 'cli_command' }))).toBeUndefined();
        expect(warn).toHaveBeenCalled();
    });

    it('warns on an unknown target-type', () => {
        expect(targetFromAttributes(element({ 'target-type': 'database' }))).toBeUndefined();
        expect(warn).toHaveBeenCalled();
    });
});

describe('modalConfigFromScript', () => {
    it('reads every documented data attribute', () => {
        const config = modalConfigFromScript(script({
            'api-url': 'http://localhost:8080',
            'attach-to': '#feedback-btn',
            'color-scheme': 'dark',
            'title': 'Send feedback',
            'placeholder': 'What is on your mind?',
            'show-title-field': 'true',
            'show-sentiment': 'true',
            'submitted-by': 'user_12345',
            'theme-primary': '#ff0000',
        }), 'ibw_key');

        expect(config).toMatchObject({
            apiKey: 'ibw_key',
            apiUrl: 'http://localhost:8080',
            attachTo: '#feedback-btn',
            colorScheme: 'dark',
            title: 'Send feedback',
            placeholder: 'What is on your mind?',
            showTitleField: true,
            showSentiment: true,
            submittedBy: 'user_12345',
            injectStyles: true,
        });
        expect(config.theme?.primary).toBe('#ff0000');
    });

    it('honors data-inject-styles="false"', () => {
        expect(modalConfigFromScript(script({ 'inject-styles': 'false' }), 'k').injectStyles).toBe(false);
    });
});
