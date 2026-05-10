import * as esbuild from 'esbuild';
import { execSync } from 'child_process';
import { readFileSync, rmSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(root, '..');
const dist = join(repoRoot, 'dist');
const isProd = process.env.NODE_ENV === 'production';
const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));

console.info('[feedback] Cleaning dist directory...');
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

console.info('[feedback] Building widget bundle...');

const shared = {
    bundle: true,
    minify: isProd,
    sourcemap: !isProd,
    logLevel: 'silent',
    metafile: true,
};

const jsShared = {
    ...shared,
    target: ['es2019', 'chrome111', 'firefox113', 'safari16.2'],
    // CSS is embedded as a text string and injected as a <style> tag at runtime,
    // so widget styles apply synchronously before any elements are created.
    loader: { '.css': 'text' },
    define: { __WIDGET_VERSION__: JSON.stringify(pkg.version) },
};

const results = await Promise.all([
    // Full bundle (modal + bar) — IIFE for script-tag usage
    esbuild.build({ ...jsShared, format: 'iife', entryPoints: [join(repoRoot, 'src/index.ts')], outfile: join(repoRoot, 'dist/widget.js') }),
    // Modal-only bundle — IIFE
    esbuild.build({ ...jsShared, format: 'iife', entryPoints: [join(repoRoot, 'src/modal-entry.ts')], outfile: join(repoRoot, 'dist/modal.js') }),
    // Bar-only bundle — IIFE
    esbuild.build({ ...jsShared, format: 'iife', entryPoints: [join(repoRoot, 'src/bar-entry.ts')], outfile: join(repoRoot, 'dist/bar.js') }),
    // Full bundle — ESM for import usage
    esbuild.build({ ...jsShared, format: 'esm', entryPoints: [join(repoRoot, 'src/index.ts')], outfile: join(repoRoot, 'dist/widget.esm.js') }),
    // Modal-only — ESM
    esbuild.build({ ...jsShared, format: 'esm', entryPoints: [join(repoRoot, 'src/modal-entry.ts')], outfile: join(repoRoot, 'dist/modal.esm.js') }),
    // Bar-only — ESM
    esbuild.build({ ...jsShared, format: 'esm', entryPoints: [join(repoRoot, 'src/bar-entry.ts')], outfile: join(repoRoot, 'dist/bar.esm.js') }),
    // Standalone CSS files (for users who load CSS manually instead of relying on JS injection)
    esbuild.build({ ...shared, entryPoints: [join(repoRoot, 'src/modal.css')], outfile: join(repoRoot, 'dist/modal.css') }),
    esbuild.build({ ...shared, entryPoints: [join(repoRoot, 'src/bar.css')], outfile: join(repoRoot, 'dist/bar.css') }),
]);

const sizes = results.flatMap(r =>
    Object.entries(r.metafile.outputs).map(([file, meta]) => {
        const kb = (meta.bytes / 1024).toFixed(1);
        return `  ${file.replace(/^\.\.\//, '')}: ${kb} KB`;
    })
);

console.info(`[feedback] Output:\n${sizes.join('\n')}`);

console.info('[feedback] Emitting type declarations...');
execSync('npx tsc --project tsconfig.declarations.json', { stdio: 'inherit', cwd: repoRoot });
console.info('[feedback] Done. To publish: npm publish');
