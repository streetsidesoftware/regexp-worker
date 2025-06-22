import type { IWorker } from './Worker.js';

export type CreateWorker = () => IWorker;

interface DI {
    createWorker: CreateWorker;
}

const di: DI = {
    createWorker: () => {
        throw new Error('Worker creation function not implemented');
    },
};

export function getCreateWorker(): CreateWorker {
    return di.createWorker;
}

export function setCreateWorker(createWorker: CreateWorker): void {
    if (typeof createWorker !== 'function') {
        throw new TypeError('createWorker must be a function');
    }
    di.createWorker = createWorker;
}

export function createWorker(): IWorker {
    const createWorkerFunc = getCreateWorker();
    return createWorkerFunc();
}
