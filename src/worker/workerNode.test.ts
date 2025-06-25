import { describe, expect, test } from 'vitest';

import { workerCodeDataURL } from './workerCodeNodeDataURL.js';
import { createWorkerNode } from './workerNode.js';

describe('createWorkerBrowser', () => {
    test('createWorkerBrowser', async () => {
        const w = createWorkerNode();
        expect(w).toBeDefined();
        // exit code is 0 in Node.js
        await expect(w.terminate()).resolves.toBe(0);
    });

    test('createWorkerBrowser', async () => {
        const w = createWorkerNode(new URL(workerCodeDataURL));
        expect(w).toBeDefined();
        // exit code is 0 in Node.js
        await expect(w.terminate()).resolves.toBe(0);
    });
});
