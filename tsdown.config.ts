import { defineConfig } from 'tsdown';

export default defineConfig([
    { entry: ['./src/index.mts'], platform: 'node', outDir: './dist/', format: 'esm' },
    { entry: ['./src/browser.ts'], platform: 'browser', outDir: './dist/' },
]);
