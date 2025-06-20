import type { Worker } from './Worker.js';
import { createWorkerNode } from './workerNode.js';

export function createWorkerNodeTest(): Worker {
    return createWorkerNode(new URL('../../out/worker/workerCodeNodeTest.js', import.meta.url));
}
