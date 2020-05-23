import { createWorker, Worker } from './worker';
import { Request, Response, isResponse, createRequest  } from './procedure';

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

    public sendRequest<T extends Request, U extends Response>(c: T): Promise<U> {
        return new Promise<U>((resolve) => {
            this.pending.set(c.id, v => resolve(v as U));
            this.worker.postMessage(c);
        });
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
