import { defineConfig } from 'tsdown';

export default defineConfig([
    { entry: ['./src/index.mts'], platform: 'node', outDir: './dist/' },
    { entry: ['./src/index.mts'], platform: 'node', outDir: './dist/', format: 'cjs' },
    { entry: ['./src/browser.ts'], platform: 'browser', outDir: './dist/' },
]);
