import { createWebWorker } from './WebWorker.js';
import type { IWorker } from './Worker.js';
import { workerCodeDataURL } from './workerCodeBrowserDataURL.js';

const defaultFilename = new URL(workerCodeDataURL);

export function createWorkerBrowser(filename: string | URL = defaultFilename): IWorker {
    return createWebWorker(filename);
}
