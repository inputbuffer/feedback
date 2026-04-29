import { describe, it, expect, beforeEach } from 'vitest';
import { applyTheme } from './theme.js';

describe('applyTheme', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    function addModal() {
        const el = document.createElement('div');
        el.id = 'ib-modal';
        document.body.appendChild(el);
        return el;
    }

    it('does nothing when #ib-modal is absent', () => {
        expect(() => applyTheme({ apiKey: 'key', theme: { primary: 'red' } })).not.toThrow();
    });

    it('sets --ib-primary', () => {
        const modal = addModal();
        applyTheme({ apiKey: 'key', theme: { primary: '#ff0000' } });
        expect(modal.style.getPropertyValue('--ib-primary')).toBe('#ff0000');
    });

    it('sets --ib-background', () => {
        const modal = addModal();
        applyTheme({ apiKey: 'key', theme: { background: '#ffffff' } });
        expect(modal.style.getPropertyValue('--ib-background')).toBe('#ffffff');
    });

    it('sets --ib-text', () => {
        const modal = addModal();
        applyTheme({ apiKey: 'key', theme: { text: '#333' } });
        expect(modal.style.getPropertyValue('--ib-text')).toBe('#333');
    });

    it('sets all three properties together', () => {
        const modal = addModal();
        applyTheme({ apiKey: 'key', theme: { primary: '#a', background: '#b', text: '#c' } });
        expect(modal.style.getPropertyValue('--ib-primary')).toBe('#a');
        expect(modal.style.getPropertyValue('--ib-background')).toBe('#b');
        expect(modal.style.getPropertyValue('--ib-text')).toBe('#c');
    });

    it('skips undefined theme properties', () => {
        const modal = addModal();
        applyTheme({ apiKey: 'key', theme: {} });
        expect(modal.style.getPropertyValue('--ib-primary')).toBe('');
        expect(modal.style.getPropertyValue('--ib-background')).toBe('');
        expect(modal.style.getPropertyValue('--ib-text')).toBe('');
    });

    it('works when theme is omitted entirely', () => {
        const modal = addModal();
        applyTheme({ apiKey: 'key' });
        expect(modal.style.getPropertyValue('--ib-primary')).toBe('');
    });
});
