import { afterEach, describe, expect, test, vi } from 'vitest';
import { nullPort } from './MessagePort.js';

import * as wmh from './WorkerMessageHandler.js';

vi.mock('./WorkerMessageHandler.js', () => ({
    createHandler: vi.fn(),
}));

const mockedCreateHandler = vi.mocked(wmh.createHandler);

describe('workerCodeNode', () => {
    afterEach(() => {
        vi.doUnmock('./workerCodeNode.js');
        vi.clearAllMocks();
        mockedCreateHandler.mockClear();
    });

    test('load workerCodeNode in worker', async () => {
        vi.doMock('worker_threads', () => ({
            parentPort: nullPort,
            isMainThread: false,
        }));

        await expect(import('./workerCodeNode.js')).resolves.toEqual(expect.any(Object));
        expect(mockedCreateHandler).toHaveBeenCalled();
    });

    test('load workerCodeNode in main', async () => {
        vi.doMock('worker_threads', () => ({
            parentPort: nullPort,
            isMainThread: true,
        }));

        expect(mockedCreateHandler).not.toHaveBeenCalled();
        await expect(import('./workerCodeNode.js')).resolves.toEqual(expect.any(Object));
        expect(mockedCreateHandler).not.toHaveBeenCalled();
    });

    test('load workerCodeNode no parentPort', async () => {
        vi.doMock('worker_threads', () => ({
            parentPort: undefined,
            isMainThread: false,
        }));

        expect(mockedCreateHandler).not.toHaveBeenCalled();
        await expect(import('./workerCodeNode.js')).resolves.toEqual(expect.any(Object));
        expect(mockedCreateHandler).not.toHaveBeenCalled();
    });
});
