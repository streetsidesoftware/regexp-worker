import type { Worker } from './Worker.js';

declare function Worker(scriptURL: string): Worker;

export function supportsWebWorkers(): boolean {
    return typeof Worker !== 'undefined';
}
