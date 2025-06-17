import type { Worker } from '../worker/index.js';
import { createWorker } from '../worker/index.js';
import type { Request, Response, ErrorResponse } from '../Procedures/procedure.js';
import { isResponse, createRequest, isErrorResponse, isRequest } from '../Procedures/procedure.js';
import type { UniqueID } from '../Procedures/uniqueId.js';
import { elapsedTimeMsFrom } from '../timer.js';

const defaultTimeLimitMs = 1000;
const defaultSleepAfter = 200;

interface Contract {
    resolve: (v: Response | Promise<Response>) => any;
    reject: (err: any) => any;
}

export class Scheduler {
    private pending: Map<UniqueID, Contract>;
    private requestQueue: Map<UniqueID, PendingRequest>;
    private _worker: Worker | undefined;
    private currentRequest: UniqueID | undefined;
    private timeoutID: NodeJS.Timeout | undefined;
    private stopped = false;
    public dispose: () => Promise<void>;

    constructor(public executionTimeLimitMs = defaultTimeLimitMs) {
        this.dispose = () => this._dispose();
        this.pending = new Map();
        this.requestQueue = new Map();
        this.currentRequest = undefined;
    }

    public scheduleRequest<T extends Request, U extends Response>(request: T, timeLimitMs = this.executionTimeLimitMs): Promise<U> {
        if (this.stopped) {
            return Promise.reject(new ErrorCanceledRequest('Scheduler has been stopped', request.requestType, request.data));
        }
        if (!isRequest(request)) {
            return Promise.reject(new ErrorBadRequest('Bad Request', request));
        }
        if (this.requestQueue.has(request.id)) {
            return this.requestQueue.get(request.id)!.promise as Promise<U>;
        }
        const promise = new Promise<U>((resolve, reject) => {
            this.pending.set(request.id, { resolve: (v) => resolve(v as U), reject });
            this.trigger();
        }).then((r) => checkResponse(r, request.data));
        this.requestQueue.set(request.id, { request, promise, timeLimitMs, startTime: undefined });
        this.trigger();
        return promise;
    }

    private _dispose() {
        if (this.stopped) return Promise.resolve();
        this.stopped = true;
        const ret = this.stopWorker();
        for (const requestId of this.requestQueue.keys()) {
            this.terminateRequest(requestId, 'Scheduler has been stopped');
        }
        this.pending.clear();
        this.requestQueue.clear();
        this.currentRequest = undefined;
        return ret;
    }

    public terminateRequest(requestId: UniqueID, message = 'Request Terminated'): Promise<void> {
        if (requestId === this.currentRequest) this.stopWorker();
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

    private stopWorker(): Promise<void> {
        if (!this._worker) return Promise.resolve();
        this._worker.removeAllListeners();
        const p = this._worker.terminate().then(() => {});
        this._worker = undefined;
        return p;
    }

    private listener(m: any) {
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
        console.warn(`Unhandled Response ${JSON.stringify(m)}`);
    }

    private trigger() {
        if (this.stopped || this.currentRequest) return;

        setImmediate(() => {
            if (this.stopped || this.currentRequest) return;
            const req = this.getNextRequest();
            if (!req) {
                // Nothing to do, stop the worker
                // This helps prevent shutdown issues if the app forgets to call dispose()
                this.scheduleTimeout(() => this.stopWorker(), defaultSleepAfter);
                return;
            }
            req.startTime = performance.now();
            const requestId = req.request.id;
            this.currentRequest = requestId;
            this.scheduleTimeout(() => this.terminateRequest(requestId, 'Request Timeout'), req.timeLimitMs);
            this.worker.postMessage(req.request);
        });
    }

    private cleanupRequest(id: UniqueID) {
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

    private scheduleTimeout(fn: () => any, delayMs: number) {
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

    private get worker(): Worker {
        if (!this._worker) {
            this._worker = createWorker();
            this._worker.on('message', (v) => this.listener(v));
        }

        return this._worker;
    }
}

export class ErrorCanceledRequest<T> extends Error {
    readonly timestamp = Date.now();
    constructor(
        message: string,
        readonly requestType: string | undefined,
        readonly elapsedTimeMs: number,
        readonly data?: T,
    ) {
        super(message);
        this.name = 'ErrorCanceledRequest';
    }
}

export class ErrorFailedRequest<T> extends Error {
    readonly timestamp = Date.now();
    constructor(
        message: string,
        readonly requestType: string | undefined,
        readonly data?: T,
    ) {
        super(message);
        this.name = 'ErrorFailedRequest';
    }
}

export class ErrorBadRequest<T> extends Error {
    readonly timestamp = Date.now();
    constructor(
        message: string,
        readonly data?: T,
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
