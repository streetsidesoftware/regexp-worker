import { defineConfig } from 'tsdown';

export default defineConfig([
    { entry: ['./src/worker/workerCodeNode.ts'], platform: 'node', outDir: './lib/', sourcemap: false, dts: false },
    // { entry: ['./src/index.mts'], platform: 'node', outDir: './lib/' },
]);
