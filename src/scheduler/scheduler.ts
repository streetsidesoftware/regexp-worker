import { createWorker, Worker } from '../worker/worker';
import { Request, Response, isResponse, createRequest, ErrorResponse, isErrorResponse  } from '../Procedures/procedure';
import { UniqueID } from '../Procedures/uniqueId';

export class Scheduler {
    private pending: Map<UniqueID, (v: Response | Promise<Response>) => any>;
    private requestQueue: Map<UniqueID, PendingRequest>;
    private worker: Worker;
    private currentRequest: UniqueID | undefined;
    private stopped = false;
    public dispose: () => Promise<number>;

    constructor() {
        this.dispose = () => this._dispose();
        this.worker = createWorker();
        this.pending = new Map();
        this.requestQueue = new Map();
        this.worker.on('message', v => this.listener(v))
        this.currentRequest = undefined;
    }

    private _dispose() {
        if (this.stopped) return Promise.resolve(0);
        this.stopped = true;
        this.worker.removeAllListeners();
        const ret = this.worker.terminate();
        for (const [uniqueId, resolve] of this.pending) {
            const request = this.requestQueue.get(uniqueId);
            resolve(Promise.reject(new ErrorCanceledRequest('Scheduler has been stopped', request?.request.requestType || 'Unknown')))
        }
        this.pending.clear()
        this.requestQueue.clear();
        this.currentRequest = undefined;
        return ret;
    }

    public scheduleRequest<T extends Request, U extends Response>(request: T): Promise<U> {
        if (this.stopped) {
            return Promise.reject(new ErrorCanceledRequest('Scheduler has been stopped', request.requestType, request.data))
        }
        if (this.requestQueue.has(request.id)) {
            return this.requestQueue.get(request.id)!.promise as Promise<U>;
        }
        const promise = new Promise<U>((resolve) => {
            this.pending.set(request.id, v => resolve(v as U));
            this.trigger();
        }).then(r => checkResponse(r, request.data));
        this.requestQueue.set(request.id, { request, promise })
        this.trigger()
        return promise;
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
        if (!this.currentRequest) {
            setImmediate(() => {
                if (this.currentRequest) return;
                const req = this.getNextRequest();
                if (!req) return;
                this.currentRequest = req.request.id;
                this.worker.postMessage(req.request);
            })
        }
    }

    private cleanupRequest(id: UniqueID) {
        this.pending.delete(id);
        this.requestQueue.delete(id);
        if (this.currentRequest === id) {
            this.currentRequest = undefined;
        }
        this.trigger();
    }

    private getNextRequest(): PendingRequest | undefined {
        const next = this.requestQueue.entries().next();
        if (next.done) return undefined;
        return next.value[1];
    }

    public createRequest<T extends Request>(requestType: T['requestType'], data: T['data']): T {
        return createRequest<T>(requestType, data);
    }
}

export class ErrorCanceledRequest<T> {
    constructor(readonly message: string, readonly requestType: string | undefined, readonly data?: T) {}
}

export class ErrorFailedRequest<T> {
    constructor(readonly message: string, readonly requestType: string | undefined, readonly data?: T) {}
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
}
