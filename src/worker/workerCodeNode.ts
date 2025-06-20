import { parentPort, isMainThread } from 'worker_threads';
import { createHandler } from './WorkerMessageHandler.js';
import { procedures } from '../Procedures/procedures.js';

if (!isMainThread && parentPort) {
    const handler = createHandler(parentPort, procedures);
    parentPort.once('close', () => handler.dispose());
}
