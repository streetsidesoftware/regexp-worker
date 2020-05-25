import { createWorker, Worker } from '../worker/worker';
import { Request, Response, isResponse, createRequest, ErrorResponse, isErrorResponse, isRequest  } from '../Procedures/procedure';
import { UniqueID } from '../Procedures/uniqueId';

const defaultTimeLimitMs = 100;

export class Scheduler {
    private pending: Map<UniqueID, (v: Response | Promise<Response>) => any>;
    private requestQueue: Map<UniqueID, PendingRequest>;
    private worker: Worker;
    private currentRequest: UniqueID | undefined;
    private timeoutID: NodeJS.Timeout | undefined;
    private stopped = false;
    public dispose: () => Promise<number>;

    constructor(public executionTimeLimitMs = defaultTimeLimitMs) {
        this.dispose = () => this._dispose();
        this.worker = createWorker();
        this.worker.on('message', v => this.listener(v))
        this.pending = new Map();
        this.requestQueue = new Map();
        this.currentRequest = undefined;
    }

    public scheduleRequest<T extends Request, U extends Response>(request: T, timeLimitMs = this.executionTimeLimitMs): Promise<U> {
        if (this.stopped) {
            return Promise.reject(new ErrorCanceledRequest('Scheduler has been stopped', request.requestType, request.data))
        }
        if (this.requestQueue.has(request.id)) {
            return this.requestQueue.get(request.id)!.promise as Promise<U>;
        }
        if (!isRequest(request)) {
            return Promise.reject(new ErrorBadRequest('Bad Request', request))
        }
        const promise = new Promise<U>((resolve) => {
            this.pending.set(request.id, v => resolve(v as U));
            this.trigger();
        }).then(r => checkResponse(r, request.data));
        this.requestQueue.set(request.id, { request, promise, timeLimitMs })
        this.trigger()
        return promise;
    }

    public terminateRequest(requestId: UniqueID, message = 'Request Terminated'): Promise<void> {
        const pRestartWorker = (requestId === this.currentRequest) ? this.restartWorker() : Promise.resolve();
        return pRestartWorker.then(() => this._terminateRequest(requestId, message));
    }

    private _dispose() {
        if (this.stopped) return Promise.resolve(0);
        this.stopped = true;
        this.worker.removeAllListeners();
        const ret = this.worker.terminate();
        for (const requestId of this.requestQueue.keys()) {
            this._terminateRequest(requestId, 'Scheduler has been stopped');
        }
        this.pending.clear()
        this.requestQueue.clear();
        this.currentRequest = undefined;
        return ret;
    }

    private _terminateRequest(requestId: UniqueID, message: string): Promise<void> {
        const resolve = this.pending.get(requestId);
        if (!resolve) {
            this.cleanupRequest(requestId);
            return Promise.reject(new ErrorBadRequest('Unknown Request'))
        }
        const request = this.requestQueue.get(requestId);
        resolve(Promise.reject(new ErrorCanceledRequest(message, request?.request.requestType || 'Unknown')));
        this.cleanupRequest(requestId);
        return Promise.resolve();
    }

    private restartWorker(): Promise<void> {
        return this.stopWorker()
        .then(() => {
            this.worker = createWorker();
            this.worker.on('message', v => this.listener(v))
        });
    }

    private stopWorker(): Promise<void> {
        if (!this.worker) return Promise.resolve();
        this.worker.removeAllListeners();
        return this.worker.terminate().then();
    }

    private listener(m: any) {
        if (isResponse(m)) {
            const resolveFn = this.pending.get(m.id);
            this.cleanupRequest(m.id);
            if (resolveFn) {
                resolveFn(m);
                return;
            }
        }
        console.warn(`Unhandled Response ${JSON.stringify(m)}`);
    }

    private trigger() {
        if (this.stopped || this.currentRequest) return;

        setImmediate(() => {
            if (this.currentRequest) return;
            const req = this.getNextRequest();
            if (!req) return;
            const requestId = req.request.id;
            this.currentRequest = requestId;
            this.timeoutID = setTimeout(() => {
                this.terminateRequest(requestId, 'Request Timeout');
            }, req.timeLimitMs)
            this.worker.postMessage(req.request);

        })
    }

    private cleanupRequest(id: UniqueID) {
        this.pending.delete(id);
        this.requestQueue.delete(id);
        if (this.currentRequest === id) {
            this.currentRequest = undefined;
            if (this.timeoutID) clearTimeout(this.timeoutID);
            this.timeoutID = undefined;
        }
        this.trigger();
    }

    private getNextRequest(): PendingRequest | undefined {
        const next = this.requestQueue.entries().next();
        if (next.done) return undefined;
        return next.value[1];
    }

    public static createRequest<T extends Request>(requestType: T['requestType'], data: T['data']): T {
        return createRequest<T>(requestType, data);
    }
}

export class ErrorCanceledRequest<T> {
    readonly timestamp = Date.now();
    constructor(readonly message: string, readonly requestType: string | undefined, readonly data?: T) {}
}

export class ErrorFailedRequest<T> {
    readonly timestamp = Date.now();
    constructor(readonly message: string, readonly requestType: string | undefined, readonly data?: T) {}
}

export class ErrorBadRequest<T> {
    readonly timestamp = Date.now();
    constructor(readonly message: string, readonly data?: T) {}
}

/**
 * Checks the type of a response or throws the response
 */
function checkResponse<T extends Response, D>(
    response: T | ErrorResponse,
    data: D
): T {
    if (isErrorResponse(response)) {
        throw new ErrorFailedRequest(response.data.message, response.data.requestType, data);
    }
    return response;
}

interface PendingRequest {
    request: Request;
    promise: Promise<Response>;
    timeLimitMs: number;
}
