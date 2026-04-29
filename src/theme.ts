import type { WidgetConfig } from './types.js';

export function applyTheme(config: WidgetConfig): void {
    const modal = document.getElementById('ib-modal');
    if (!modal) return;

    const { theme = {} } = config;
    if (theme.primary) modal.style.setProperty('--ib-primary', theme.primary);
    if (theme.background) modal.style.setProperty('--ib-background', theme.background);
    if (theme.surface) modal.style.setProperty('--ib-surface', theme.surface);
    if (theme.text) modal.style.setProperty('--ib-text', theme.text);
    if (theme.selected) modal.style.setProperty('--ib-selected', theme.selected);
    if (theme.selectedColor) modal.style.setProperty('--ib-selected-color', theme.selectedColor);
}
