import {
    type ExecRegExpMatrixResult,
    type ExecRegExpResult,
    type FlatRanges,
    flatRangesToRanges,
    type MatchRegExpArrayResult as _MatchRegExpArrayResult,
    type MatchRegExpResult as _MatchRegExpResult,
    type Range,
} from './helpers/evaluateRegExp.js';
import { Scheduler } from './scheduler/index.js';
import {
    createRequestExecRegExp,
    createRequestExecRegExpMatrix,
    type Response,
    type RequestExecRegExp,
    type RequestExecRegExpMatrix,
} from './Procedures/index.js';
import { type RequestMatchRegExp, createRequestMatchRegExp } from './Procedures/procMatchRegExp.js';
import { type RequestMatchRegExpArray, createRequestMatchRegExpArray } from './Procedures/procMatchRegExpArray.js';
import { isTimeoutErrorLike, TimeoutError } from './TimeoutError.js';
import { createWorkerNode } from './worker/workerNode.js';

export { type ExecRegExpResult, type ExecRegExpMatrixResult, toRegExp, type Range } from './helpers/evaluateRegExp.js';

export class RegExpWorker {
    private scheduler: Scheduler;
    public dispose: () => Promise<void> = () => this._dispose();

    constructor(timeoutMs?: number) {
        this.scheduler = new Scheduler(createWorkerNode, timeoutMs);
    }

    public execRegExp(regExp: RegExp, text: string, timeLimitMs?: number): Promise<ExecRegExpResult> {
        const req = createRequestExecRegExp({ regexp: regExp, text });
        return this.makeRequest(req, timeLimitMs);
    }

    public execRegExpMatrix(regExpArray: RegExp[], textArray: string[], timeLimitMs?: number): Promise<ExecRegExpMatrixResult> {
        const req = createRequestExecRegExpMatrix({ regExpArray, textArray });
        return this.makeRequest(req, timeLimitMs);
    }

    public async matchRegExp(text: string, regExp: RegExp, timeLimitMs?: number): Promise<MatchRegExpResult> {
        const req = createRequestMatchRegExp({ regexp: regExp, text });
        const res = await this.makeRequest(req, timeLimitMs);
        return MatchRegExpResult.create(res);
    }

    public async matchRegExpArray(text: string, regExp: RegExp[], timeLimitMs?: number): Promise<MatchRegExpArrayResult> {
        const req = createRequestMatchRegExpArray({ regexps: regExp, text });
        const res = await this.makeRequest(req, timeLimitMs);
        return MatchRegExpArrayResult.create(res);
    }

    private makeRequest(req: RequestExecRegExp, timeLimitMs: number | undefined): Promise<ExecRegExpResult>;
    private makeRequest(req: RequestExecRegExpMatrix, timeLimitMs: number | undefined): Promise<ExecRegExpMatrixResult>;
    private makeRequest(req: RequestMatchRegExp, timeLimitMs: number | undefined): Promise<_MatchRegExpResult>;
    private makeRequest(req: RequestMatchRegExpArray, timeLimitMs: number | undefined): Promise<_MatchRegExpArrayResult>;
    private makeRequest(
        req: RequestExecRegExp | RequestExecRegExpMatrix | RequestMatchRegExp | RequestMatchRegExpArray,
        timeLimitMs: number | undefined,
    ): Promise<ExecRegExpResult> | Promise<ExecRegExpMatrixResult> | Promise<_MatchRegExpResult> | Promise<_MatchRegExpArrayResult> {
        return this.scheduler.scheduleRequest(req, timeLimitMs).then(extractResult, timeoutRejection) as Promise<ExecRegExpResult>;
    }

    /**
     * Shuts down the background Worker and rejects any pending scheduled items.
     */
    private async _dispose(): Promise<void> {
        return this.scheduler.dispose();
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

export function timeoutRejection(e: unknown): Promise<never> {
    if (e instanceof TimeoutError) return Promise.reject(e);
    if (e instanceof Error) return Promise.reject(e);
    if (!isTimeoutErrorLike(e)) return Promise.reject(new Error('Unknown Error', { cause: e }));
    return Promise.reject(new TimeoutError(e.message, e.elapsedTimeMs));
}

export async function execRegExpOnWorker(regExp: RegExp, text: string, timeLimitMs?: number): Promise<ExecRegExpResult> {
    const worker = new RegExpWorker();
    return await worker.execRegExp(regExp, text, timeLimitMs);
}

export async function execRegExpMatrixOnWorker(
    regExpArray: RegExp[],
    textArray: string[],
    timeLimitMs?: number,
): Promise<ExecRegExpMatrixResult> {
    const worker = new RegExpWorker();
    return await worker.execRegExpMatrix(regExpArray, textArray, timeLimitMs);
}

export class MatchRegExpResult {
    private constructor(
        readonly elapsedTimeMs: number,
        readonly raw_ranges: FlatRanges,
    ) {}

    /**
     * The range tuples that matched the full regular expression.
     * Each tuple is: [startIndex, endIndex]
     */
    get ranges(): IterableIterator<Range> {
        return flatRangesToRanges(this.raw_ranges);
    }

    static create(res: _MatchRegExpResult): MatchRegExpResult {
        return new MatchRegExpResult(res.elapsedTimeMs, res.ranges);
    }
}

export class MatchRegExpArrayResult {
    constructor(
        readonly elapsedTimeMs: number,
        readonly results: MatchRegExpResult[],
    ) {}

    static create(res: _MatchRegExpArrayResult): MatchRegExpArrayResult {
        return new MatchRegExpArrayResult(
            res.elapsedTimeMs,
            res.results.map((r) => MatchRegExpResult.create(r)),
        );
    }
}
