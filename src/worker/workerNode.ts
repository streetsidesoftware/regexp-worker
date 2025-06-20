import { Worker as NodeWorker } from 'worker_threads';
import { workerCodeDataURL } from './workerCodeDataURL.js';
import type { Worker } from './Worker.js';

export type { Worker } from './Worker.js';

const defaultFilename = new URL(workerCodeDataURL);

export function createWorkerNode(filename: string | URL = defaultFilename): Worker {
    return new NodeWorker(filename);
}
