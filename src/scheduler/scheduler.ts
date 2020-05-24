import { createWorker, Worker } from '../worker/worker';
import { Request, Response, isResponse, createRequest, ErrorResponse, isErrorResponse  } from '../Procedures/procedure';


export class Scheduler {
    private pending: Map<string, (v: Response) => any>;
    private worker: Worker;
    public dispose: () => Promise<number>;

    constructor() {
        this.dispose = () => this._dispose();
        this.worker = createWorker();
        this.pending = new Map();
        this.worker.on('message', v => this.listener(v))
    }

    private _dispose() {
        this.worker.removeAllListeners();
        return this.worker.terminate();
    }

    public sendRequest<T extends Request, U extends Response>(req: T): Promise<U> {
        const promise = new Promise<U>((resolve) => {
            this.pending.set(req.id, v => resolve(v as U));
            this.worker.postMessage(req);
        }).then(r => checkResponse(r, req.data));
        return promise;
    }

    private listener(m: any) {
        if (isResponse(m)) {
            this.pending.get(m.id)?.(m);
            this.pending.delete(m.id);
        }
    }

    public createRequest<T extends Request>(requestType: T['requestType'], data: T['data']): T {
        return createRequest<T>(requestType, data);
    }
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
