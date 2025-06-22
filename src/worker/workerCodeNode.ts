import { isMainThread, parentPort } from 'worker_threads';

import { procedures } from '../Procedures/procedures.js';
import { createHandler } from './WorkerMessageHandler.js';

if (!isMainThread && parentPort) {
    const handler = createHandler(parentPort, procedures);
    parentPort.once('close', () => handler.dispose());
}
