import { parentPort, isMainThread } from 'worker_threads';
import { createHandler } from './WorkerMessageHandler.js';

if (!isMainThread && parentPort) {
    const handler = createHandler(parentPort);
    parentPort.once('close', () => handler.dispose());
} else {
    throw new Error('workerNode only run in a node Worker thread context. ');
}
