import { parentPort, isMainThread, Worker } from 'worker_threads';
import { createHandler } from './WorkerMessageHandler.js';
import { fileURLToPath } from 'url';

export type { Worker } from 'worker_threads';

const __filename = fileURLToPath(import.meta.url);

const defaultFilename = __filename;

export function createWorker(filename: string = defaultFilename): Worker {
    return new Worker(filename);
}

if (!isMainThread && parentPort) {
    const handler = createHandler(parentPort);
    parentPort.once('close', handler.dispose);
}
