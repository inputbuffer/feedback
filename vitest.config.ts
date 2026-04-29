import { defineConfig } from 'vitest/config';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

export default defineConfig({
    define: {
        __WIDGET_VERSION__: JSON.stringify(pkg.version),
    },
    test: {
        environment: 'jsdom',
        globals: true,
    },
});
