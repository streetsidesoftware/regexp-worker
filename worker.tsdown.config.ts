import { defineConfig } from 'tsdown';

/**
 * This configuration file is used to build the worker code.
 */

export default defineConfig([
    { entry: ['./src/worker/workerCodeNode.ts'], platform: 'node', outDir: './lib/', sourcemap: false, dts: false },
    // todo: add browser build
]);
