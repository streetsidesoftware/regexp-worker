import { describe, expect, test, vi } from 'vitest';

import { createWebWorker } from './WebWorker.js';
import { createWorkerBrowser } from './workerBrowser.js';
import { workerCodeDataURL } from './workerCodeBrowserDataURL.js';

const sym = Symbol('test');

vi.mock('./WebWorker.js', () => ({
    createWebWorker: vi.fn(() => sym),
}));

const mockCreateWebWorker = vi.mocked(createWebWorker);

describe('createWorkerBrowser', () => {
    test('createWorkerBrowser', () => {
        const w0 = createWorkerBrowser();
        expect(w0).toBeDefined();
        expect(mockCreateWebWorker).toHaveBeenLastCalledWith(new URL(workerCodeDataURL));

        const w1 = createWorkerBrowser(import.meta.url);
        expect(w1).toBeDefined();
        expect(mockCreateWebWorker).toHaveBeenLastCalledWith(import.meta.url);
    });
});
