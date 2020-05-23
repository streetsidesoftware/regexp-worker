import { parentPort, isMainThread, Worker } from 'worker_threads';
import { createHandler } from './WorkerMessageHandler';
import * as Path from 'path';
export { Worker } from 'worker_threads';

let defaultFilename = __filename;

// If this isn't the .js file, then we need to point to the .js file.
// This can happen when running jest with ts-loader.
if (!defaultFilename.match(/\.js$/)) {
    defaultFilename = Path.join(__dirname, '..', 'lib', 'worker.js');
}

export function createWorker(filename: string = defaultFilename): Worker {
    return new Worker(filename);
}

if (!isMainThread && parentPort) {
    const handler = createHandler(parentPort);
    parentPort.once('close', handler.dispose);
}
