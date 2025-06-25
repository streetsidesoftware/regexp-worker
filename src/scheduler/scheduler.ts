import { catchErrors } from '../helpers/errors.js';
import type { ErrorResponse, Request, Response } from '../Procedures/procedure.js';
import { createRequest, isErrorResponse, isRequest, isResponse } from '../Procedures/procedure.js';
import type { UniqueID } from '../Procedures/uniqueId.js';
import { TimeoutError } from '../TimeoutError.js';
import { elapsedTimeMsFrom } from '../timer.js';
import type { Worker } from '../worker/index.js';

const defaultTimeLimitMs = 1000;
const defaultSleepAfter = 200;

interface Contract {
    resolve: (v: Response | Promise<Response>) => unknown;
    reject: (err: unknown) => unknown;
}

export class Scheduler {
    private pending: Map<UniqueID, Contract>;
    private requestQueue: Map<UniqueID, PendingRequest>;
    private _worker: Worker | undefined;
    private currentRequest: UniqueID | undefined;
    private timeoutID: NodeJS.Timeout | undefined;
    private stopped = false;
    public dispose: () => Promise<void>;

    /**
     *
     * @param createWorker - Function to create a new worker instance.
     * @param executionTimeLimitMs - Time limit in milliseconds for each request execution. Default is 1000ms.
     * @param stopIdleWorkerAfterMs - Time in milliseconds to wait after processing the last request before stopping the worker. Default is 200ms.
     */
    constructor(
        readonly createWorker: () => Worker,
        public executionTimeLimitMs: number = defaultTimeLimitMs,
        public stopIdleWorkerAfterMs: number = defaultSleepAfter,
    ) {
        this.dispose = () => this._dispose();
        this.pending = new Map();
        this.requestQueue = new Map();
        this.currentRequest = undefined;
    }

    public scheduleRequest<T extends Request, U extends Response>(request: T, timeLimitMs: number = this.executionTimeLimitMs): Promise<U> {
        if (this.stopped) {
            return Promise.reject(new ErrorCanceledRequest('Scheduler has been stopped', request.requestType, 0, request.data));
        }
        if (!isRequest(request)) {
            return Promise.reject(new ErrorBadRequest('Bad Request', request));
        }
        const req = this.requestQueue.get(request.id);
        if (req) {
            return req.promise as Promise<U>;
        }
        const promise = new Promise<U>((resolve, reject) => {
            this.pending.set(request.id, { resolve: (v) => resolve(v as U), reject });
            this.trigger();
        }).then((r) => checkResponse(r, request.data));
        this.requestQueue.set(request.id, { request, promise, timeLimitMs, startTime: undefined });
        this.trigger();
        return promise;
    }

    private _dispose(): Promise<void> {
        if (this.stopped) return Promise.resolve();
        this.stopped = true;
        const ret = this.stopWorker();
        for (const requestId of this.requestQueue.keys()) {
            catchErrors(this.terminateRequest(requestId, 'Scheduler has been stopped'));
        }
        this.pending.clear();
        this.requestQueue.clear();
        this.currentRequest = undefined;
        return ret;
    }

    public terminateRequest(requestId: UniqueID, message = 'Request Terminated'): Promise<void> {
        if (requestId === this.currentRequest) catchErrors(this.stopWorker());
        const contract = this.pending.get(requestId);
        if (!contract) {
            this.cleanupRequest(requestId);
            return Promise.reject(new ErrorBadRequest('Unknown Request'));
        }
        const request = this.requestQueue.get(requestId);
        // istanbul ignore else
        const elapsedTime = request?.startTime ? elapsedTimeMsFrom(request.startTime) : 0;
        // istanbul ignore else
        contract.reject(new ErrorCanceledRequest(message, request?.request.requestType || 'Unknown', elapsedTime));
        this.cleanupRequest(requestId);
        return Promise.resolve();
    }

    private listener(m: unknown): void {
        // istanbul ignore else
        if (isResponse(m)) {
            const contract = this.pending.get(m.id);
            this.cleanupRequest(m.id);
            // istanbul ignore else
            if (contract) {
                contract.resolve(m);
                return;
            }
        }
        // istanbul ignore next
        console.warn(`Unhandled Response ${JSON.stringify(m)}`);
    }

    private trigger(): void {
        if (this.stopped || this.currentRequest) return;

        setTimeout(() => {
            if (this.stopped || this.currentRequest) return;
            const req = this.getNextRequest();
            if (!req) {
                // Nothing to do, stop the worker
                // This helps prevent shutdown issues if the app forgets to call dispose()
                this.scheduleTimeout(() => this.stopWorker(), this.stopIdleWorkerAfterMs);
                return;
            }
            req.startTime = performance.now();
            const requestId = req.request.id;
            this.currentRequest = requestId;
            this.scheduleTimeout(() => this.terminateRequest(requestId, 'Request Timeout'), req.timeLimitMs);
            this.worker.postMessage(req.request);
        }, 0);
    }

    private cleanupRequest(id: UniqueID): void {
        this.pending.delete(id);
        this.requestQueue.delete(id);
        // istanbul ignore else
        if (this.currentRequest === id) {
            this.currentRequest = undefined;
            // istanbul ignore else
            if (this.timeoutID) clearTimeout(this.timeoutID);
            this.timeoutID = undefined;
        }
        this.trigger();
    }

    private scheduleTimeout(fn: () => unknown, delayMs: number): void {
        if (this.timeoutID) clearTimeout(this.timeoutID);
        this.timeoutID = setTimeout(fn, delayMs);
    }

    private getNextRequest(): PendingRequest | undefined {
        const next = this.requestQueue.entries().next();
        if (next.done) {
            return undefined;
        }
        return next.value[1];
    }

    public static createRequest<T extends Request>(requestType: T['requestType'], data: T['data']): T {
        return createRequest<T>(requestType, data);
    }

    #onMessage: (m: unknown) => void = (m) => this.listener(m);

    /**
     * Stops and clears the worker.
     * This method is not async on purpose. We need to clear the worker
     * immediately to allow a new worker to be created before waiting on the promise to resolve.
     * @returns A promise that resolves when the worker is stopped.
     */
    private stopWorker(): Promise<void> {
        if (!this._worker) return Promise.resolve();
        this._worker?.off('message', this.#onMessage);
        this._worker.removeAllListeners?.();
        const worker = this._worker;
        // disconnect the worker to allow a new worker to be created
        this._worker = undefined;
        return Promise.resolve(worker.terminate()).then(() => {});
    }

    private get worker(): Worker {
        if (!this._worker) {
            this._worker = this.createWorker();
            this._worker.on('message', this.#onMessage);
        }

        return this._worker;
    }
}

export class ErrorCanceledRequest<T = unknown> extends TimeoutError {
    readonly timestamp: number = Date.now();
    constructor(
        message: string,
        readonly requestType: string | undefined,
        elapsedTimeMs: number,
        readonly data?: T | undefined,
    ) {
        super(message, elapsedTimeMs);
        this.name = 'ErrorCanceledRequest';
    }
}

export class ErrorFailedRequest<T> extends Error {
    readonly timestamp: number = Date.now();
    constructor(
        message: string,
        readonly requestType: string | undefined,
        readonly data?: T | undefined,
    ) {
        super(message);
        this.name = 'ErrorFailedRequest';
    }
}

export class ErrorBadRequest<T> extends Error {
    readonly timestamp: number = Date.now();
    constructor(
        message: string,
        readonly data?: T | undefined,
    ) {
        super(message);
        this.name = 'ErrorBadRequest';
    }
}

/**
 * Checks the type of a response or throws the response
 */
function checkResponse<T extends Response, D>(response: T | ErrorResponse, data: D): T {
    if (isErrorResponse(response)) {
        throw new ErrorFailedRequest(response.data.message, response.data.requestType, data);
    }
    return response;
}

interface PendingRequest {
    request: Request;
    promise: Promise<Response>;
    timeLimitMs: number;
    startTime: number | undefined;
}
