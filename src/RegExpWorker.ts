import { ExecRegExpResult, ExecRegExpMatrixResult } from './helpers/evaluateRegExp';
import { Scheduler } from './scheduler';
import {
    createRequestExecRegExp,
    createRequestExecRegExpMatrix,
    Response,
    RequestExecRegExp,
    RequestExecRegExpMatrix,
} from './Procedures';

export { ExecRegExpResult, ExecRegExpMatrixResult, toRegExp } from './helpers/evaluateRegExp';

export interface TimeoutError {
    message: string;
    elapsedTimeMs: number;
}

export class RegExpWorker {
    private scheduler: Scheduler;
    public dispose: () => Promise<void> = () => this._dispose();

    constructor(timeoutMs?: number) {
        this.scheduler = new Scheduler(timeoutMs);
    }

    public execRegExp(regExp: RegExp, text: string, timeLimitMs?: number): Promise<ExecRegExpResult> {
        const req = createRequestExecRegExp({ regexp: regExp, text });
        return this.makeRequest(req, timeLimitMs);
    }

    public execRegExpMatrix(regExpArray: RegExp[], textArray: string[], timeLimitMs?: number): Promise<ExecRegExpMatrixResult> {
        const req = createRequestExecRegExpMatrix({ regExpArray, textArray });
        return this.makeRequest(req, timeLimitMs);
    }

    private makeRequest(req: RequestExecRegExp, timeLimitMs: number | undefined): Promise<ExecRegExpResult>;
    private makeRequest(req: RequestExecRegExpMatrix, timeLimitMs: number | undefined): Promise<ExecRegExpMatrixResult>;
    private makeRequest(req: RequestExecRegExp | RequestExecRegExpMatrix, timeLimitMs: number | undefined): Promise<ExecRegExpResult> | Promise<ExecRegExpMatrixResult> {
        return this.scheduler.scheduleRequest(req, timeLimitMs).then(extractResult, timeoutRejection);
    }

    /**
     * Shuts down the background Worker and rejects any pending scheduled items.
     */
    private _dispose(): Promise<void> {
        return this.scheduler.dispose().then();
    }

    set timeout(timeoutMs: number) {
        this.scheduler.executionTimeLimitMs = timeoutMs;
    }

    get timeout(): number {
        return this.scheduler.executionTimeLimitMs;
    }
}

function extractResult<T extends Response>(response: T): T['data'] {
    return response.data;
}

function timeoutRejection(e: any) {
    if (!e || !e.message || !e.elapsedTimeMs) return Promise.reject(e);
    return Promise.reject({
        message: e.message,
        elapsedTimeMs: e.elapsedTimeMs,
    });
}

export function execRegExpOnWorker(regExp: RegExp, text: string, timeLimitMs?: number): Promise<ExecRegExpResult> {
    const worker = new RegExpWorker();
    return worker.execRegExp(regExp, text, timeLimitMs).finally(worker.dispose);
}

export function execRegExpMatrixOnWorker(regExpArray: RegExp[], textArray: string[], timeLimitMs?: number): Promise<ExecRegExpMatrixResult> {
    const worker = new RegExpWorker();
    return worker.execRegExpMatrix(regExpArray, textArray, timeLimitMs).finally(worker.dispose);
}
