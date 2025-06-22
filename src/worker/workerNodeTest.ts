import type { IWorker } from './Worker.js';
import { createWorkerNode } from './workerNode.js';

export function createWorkerNodeTest(): IWorker {
    return createWorkerNode(new URL('../../out/worker/workerCodeNodeTest.js', import.meta.url));
}
