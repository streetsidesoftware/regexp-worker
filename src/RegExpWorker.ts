import {
    ExecRegExpMatrixResult,
    ExecRegExpResult,
    FlatRanges,
    flatRangesToRanges,
    MatchRegExpArrayResult as _MatchRegExpArrayResult,
    MatchRegExpResult as _MatchRegExpResult,
    Range,
} from './helpers/evaluateRegExp.js';
import { Scheduler } from './scheduler/index.js';
import {
    createRequestExecRegExp,
    createRequestExecRegExpMatrix,
    Response,
    RequestExecRegExp,
    RequestExecRegExpMatrix,
} from './Procedures/index.js';
import { RequestMatchRegExp, createRequestMatchRegExp } from './Procedures/procMatchRegExp.js';
import { RequestMatchRegExpArray, createRequestMatchRegExpArray } from './Procedures/procMatchRegExpArray.js';

export { ExecRegExpResult, ExecRegExpMatrixResult, toRegExp, Range } from './helpers/evaluateRegExp.js';

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

    public matchRegExp(text: string, regExp: RegExp, timeLimitMs?: number): Promise<MatchRegExpResult> {
        const req = createRequestMatchRegExp({ regexp: regExp, text });
        return this.makeRequest(req, timeLimitMs).then(MatchRegExpResult.create);
    }

    public matchRegExpArray(text: string, regExp: RegExp[], timeLimitMs?: number): Promise<MatchRegExpArrayResult> {
        const req = createRequestMatchRegExpArray({ regexps: regExp, text });
        return this.makeRequest(req, timeLimitMs).then(MatchRegExpArrayResult.create);
    }

    private makeRequest(req: RequestExecRegExp, timeLimitMs: number | undefined): Promise<ExecRegExpResult>;
    private makeRequest(req: RequestExecRegExpMatrix, timeLimitMs: number | undefined): Promise<ExecRegExpMatrixResult>;
    private makeRequest(req: RequestMatchRegExp, timeLimitMs: number | undefined): Promise<_MatchRegExpResult>;
    private makeRequest(req: RequestMatchRegExpArray, timeLimitMs: number | undefined): Promise<_MatchRegExpArrayResult>;
    private makeRequest(
        req: RequestExecRegExp | RequestExecRegExpMatrix | RequestMatchRegExp | RequestMatchRegExpArray,
        timeLimitMs: number | undefined,
    ): Promise<ExecRegExpResult> | Promise<ExecRegExpMatrixResult> | Promise<_MatchRegExpResult> | Promise<_MatchRegExpArrayResult> {
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

export function execRegExpMatrixOnWorker(
    regExpArray: RegExp[],
    textArray: string[],
    timeLimitMs?: number,
): Promise<ExecRegExpMatrixResult> {
    const worker = new RegExpWorker();
    return worker.execRegExpMatrix(regExpArray, textArray, timeLimitMs).finally(worker.dispose);
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
        return new MatchRegExpArrayResult(res.elapsedTimeMs, res.results.map(MatchRegExpResult.create));
    }
}
