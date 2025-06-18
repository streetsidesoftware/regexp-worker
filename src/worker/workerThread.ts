import { Worker } from 'worker_threads';
import { workerCodeDataURL } from './workerCodeDataURL.js';

export type { Worker } from 'worker_threads';

const defaultFilename = new URL(workerCodeDataURL);

export function createWorker(filename: string | URL = defaultFilename): Worker {
    return new Worker(filename);
}
