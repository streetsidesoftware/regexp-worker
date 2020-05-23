import { parentPort, isMainThread, Worker } from 'worker_threads';
import { createHandler } from './WorkerMessageHandler';
export { Worker } from 'worker_threads';

export function createWorker(filename?: string): Worker {
    filename = filename || __filename;
    return new Worker(filename);
}

if (!isMainThread && parentPort) {
    const handler = createHandler(parentPort);
    parentPort.once('close', handler.dispose);
}
