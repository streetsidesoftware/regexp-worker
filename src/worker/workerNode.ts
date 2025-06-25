import { Worker as NodeWorker } from 'node:worker_threads';

import type { IWorker } from './Worker.js';
import { workerCodeDataURL } from './workerCodeNodeDataURL.js';

export type { IWorker as Worker } from './Worker.js';

const defaultFilename = new URL(workerCodeDataURL);

export function createWorkerNode(filename: string | URL = defaultFilename): IWorker {
    return new NodeWorker(filename);
}
