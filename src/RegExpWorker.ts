import type {
    ExecRegExpResult,
    MatchAllRegExpArrayResult,
    MatchAllToRangesRegExpResult,
    MatchRegExpResult,
} from './helpers/evaluateRegExp.js';
import type { MatchAllRegExpResult } from './helpers/evaluateRegExp.js';
import { normalizeRegExp, type RegExpLike } from './helpers/regexp.js';
import type { RequestMatchRegExp } from './Procedures/index.js';
import type {
    RequestExecRegExp,
    RequestMatchAllRegExp,
    RequestMatchAllRegExpArray,
    RequestMatchAllRegExpAsRange,
    Response,
} from './Procedures/index.js';
import {
    createRequestExecRegExp,
    createRequestMatchAllRegExp,
    createRequestMatchRegExp,
    createRequestMatchRegExpArray,
} from './Procedures/index.js';
import { createRequestMatchAllRegExpAsRange } from './Procedures/procMatchAllRegExpAsRange.js';
import { Scheduler } from './scheduler/index.js';
import { isTimeoutErrorLike, TimeoutError } from './TimeoutError.js';
import type { CreateWorker } from './worker/di.js';

export type { ExecRegExpResult, MatchAllRegExpArrayResult, MatchAllRegExpResult, MatchRegExpResult } from './helpers/evaluateRegExp.js';

if (typeof Symbol.dispose === 'undefined') {
    // Polyfill for Symbol.dispose if not available
    // This is necessary for environments that do not support the dispose protocol natively
    (Symbol as unknown as { dispose: symbol }).dispose = Symbol.for('dispose');
}

if (typeof Symbol.asyncDispose === 'undefined') {
    // Polyfill for Symbol.dispose if not available
    // This is necessary for environments that do not support the dispose protocol natively
    (Symbol as unknown as { asyncDispose: symbol }).asyncDispose = Symbol.for('asyncDispose');
}

export class RegExpWorkerBase {
    private scheduler: Scheduler;
    public dispose: () => Promise<void> = () => this._dispose();

    /**
     *
     * @param createWorker Function to create a new worker instance.
     * @param timeoutMs - Optional time limit in milliseconds for each request execution. Default is 1000ms.
     * @param stopIdleWorkerAfterMs - Optional time in milliseconds to wait after processing the
     */
    constructor(createWorker: CreateWorker, timeoutMs?: number, stopIdleWorkerAfterMs?: number) {
        this.scheduler = new Scheduler(createWorker, timeoutMs, stopIdleWorkerAfterMs);
    }

    /**
     * Run RegExp.exec in a worker.
     * @param regExp - The regular expression to execute.
     * @param text - The text to search within.
     * @param timeLimitMs - Optional time limit in milliseconds for the operation.
     */
    public exec(regExp: RegExpLike, text: string, timeLimitMs?: number): Promise<ExecRegExpResult> {
        regExp = normalizeRegExp(regExp);
        const req = createRequestExecRegExp({ regexp: regExp, text });
        return this.makeRequest(req, timeLimitMs);
    }

    /**
     * Run text.matchAll against a RegExp in a worker.
     * @param text - The text to search within.
     * @param regExp - The regular expression to match against the text.
     * @param timeLimitMs - Optional time limit in milliseconds for the operation.
     */
    public matchAll(text: string, regExp: RegExpLike, timeLimitMs?: number): Promise<MatchAllRegExpResult> {
        regExp = normalizeRegExp(regExp);
        const req = createRequestMatchAllRegExp({ regexp: regExp, text });
        return this.makeRequest(req, timeLimitMs);
    }

    /**
     * Run text.match with a RegExp in a worker.
     * @param text - The text to search within.
     * @param regExp - The regular expression to match against the text.
     * @param timeLimitMs - Optional time limit in milliseconds for the operation.
     */
    public match(text: string, regExp: RegExpLike, timeLimitMs?: number): Promise<MatchRegExpResult> {
        regExp = normalizeRegExp(regExp);
        const req = createRequestMatchRegExp({ regexp: regExp, text });
        return this.makeRequest(req, timeLimitMs);
    }

    /**
     * Runs text.matchAll against an array of RegExps in a worker.
     * @param text - The text to search within.
     * @param regExps - An array of regular expressions to match against the text.
     * @param timeLimitMs - Optional time limit in milliseconds for the operation.
     */
    public matchAllArray(text: string, regExp: RegExpLike[], timeLimitMs?: number): Promise<MatchAllRegExpArrayResult> {
        regExp = regExp.map(normalizeRegExp);
        const req = createRequestMatchRegExpArray({ regexps: regExp, text });
        return this.makeRequest(req, timeLimitMs);
    }

    /**
     * Runs text.matchAll against an array of RegExps in a worker.
     * @param text - The text to search within.
     * @param regExp - A regular expressions to match against the text.
     * @param timeLimitMs - Optional time limit in milliseconds for the operation.
     */
    public async matchAllAsRangePairs(text: string, regExp: RegExpLike, timeLimitMs?: number): Promise<MatchAllAsRangePairsResult> {
        regExp = normalizeRegExp(regExp);
        const req = createRequestMatchAllRegExpAsRange({ regexp: regExp, text });
        const result = await this.makeRequest(req, timeLimitMs);
        return {
            elapsedTimeMs: result.elapsedTimeMs,
            ranges: mapToRanges(result.ranges),
        };
    }

    private makeRequest(req: RequestExecRegExp, timeLimitMs: number | undefined): Promise<ExecRegExpResult>;
    private makeRequest(req: RequestMatchRegExp, timeLimitMs: number | undefined): Promise<MatchRegExpResult>;
    private makeRequest(req: RequestMatchAllRegExp, timeLimitMs: number | undefined): Promise<MatchAllRegExpResult>;
    private makeRequest(req: RequestMatchAllRegExpAsRange, timeLimitMs: number | undefined): Promise<MatchAllToRangesRegExpResult>;
    private makeRequest(req: RequestMatchAllRegExpArray, timeLimitMs: number | undefined): Promise<MatchAllRegExpArrayResult>;
    private makeRequest(
        req: RequestExecRegExp | RequestMatchAllRegExp | RequestMatchAllRegExpArray | RequestMatchAllRegExpAsRange | RequestMatchRegExp,
        timeLimitMs: number | undefined,
    ):
        | Promise<ExecRegExpResult>
        | Promise<MatchAllRegExpArrayResult>
        | Promise<MatchAllRegExpResult>
        | Promise<MatchAllToRangesRegExpResult>
        | Promise<MatchRegExpResult> {
        return this.scheduler.scheduleRequest(req, timeLimitMs).then(extractResult, timeoutRejection) as Promise<MatchAllRegExpResult>;
    }

    [Symbol.dispose](): void {
        this._dispose().catch(() => {});
    }

    [Symbol.asyncDispose](): Promise<void> {
        return this._dispose().catch(() => {});
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

/**
 * Each range is represented as a tuple of [start, end] indices.
 * The start index is inclusive, and the end index is exclusive.
 */
export type RangePair = [start: number, end: number];

export interface MatchAllAsRangePairsResult {
    elapsedTimeMs: number;
    /**
     * The ranges of matches in the text.
     * Each range is represented as a tuple of [start, end] indices.
     * The start index is inclusive, and the end index is exclusive.
     */
    ranges: RangePair[];
}

function mapToRanges(flatRange: Uint32Array): RangePair[] {
    const size = flatRange.length;
    const result: RangePair[] = new Array<RangePair>(size / 2);
    for (let i = 0, j = 0; i < size; i += 2, j++) {
        result[j] = [flatRange[i], flatRange[i + 1]];
    }
    return result;
}

/**
 * Create a new instance of RegExpWorkerBase.
 * @param createWorker Function to create a new worker instance.
 * @param timeoutMs - Optional time limit in milliseconds for each request execution. Default is 1000ms.
 * @param stopIdleWorkerAfterMs - Optional time in milliseconds to wait after processing the last
 * @returns
 */
export function createRegExpWorker(createWorker: CreateWorker, timeoutMs?: number, stopIdleWorkerAfterMs?: number): RegExpWorkerBase {
    return new RegExpWorkerBase(createWorker, timeoutMs, stopIdleWorkerAfterMs);
}

export async function createAndApplyToWorker<T>(
    createRegExpWorker: CreateRegExpWorker,
    fn: (worker: RegExpWorkerBase) => Promise<T>,
    timeoutMs?: number,
    stopIdleWorkerAfterMs?: number,
): Promise<T> {
    await using worker = createRegExpWorker(timeoutMs, stopIdleWorkerAfterMs);
    return await fn(worker);
}

export type CreateRegExpWorker<T extends RegExpWorkerBase = RegExpWorkerBase> = (timeoutMs?: number, stopIdleWorkerAfterMs?: number) => T;

/**
 * Run text.matchAll against a RegExp in a worker.
 * @param text - The text to search within.
 * @param regExp - The regular expression to match against the text.
 * @param timeLimitMs - Optional time limit in milliseconds for the operation.
 */
export function crWorkerMatchAll(
    createRegExpWorker: CreateRegExpWorker,
    text: string,
    regExp: RegExp,
    timeLimitMs?: number,
): Promise<MatchAllRegExpResult> {
    return createAndApplyToWorker(createRegExpWorker, (worker) => worker.matchAll(text, regExp, timeLimitMs));
}

/**
 * Run text.matchAll against a RegExp in a worker and return the matches as [start, end] range pairs.
 * @param text - The text to search within.
 * @param regExp - The regular expression to match against the text.
 * @param timeLimitMs - Optional time limit in milliseconds for the operation.
 */
export function crWorkerMatchAllAsRangePairs(
    createRegExpWorker: CreateRegExpWorker,
    text: string,
    regExp: RegExp,
    timeLimitMs?: number,
): Promise<MatchAllAsRangePairsResult> {
    return createAndApplyToWorker(createRegExpWorker, (worker) => worker.matchAllAsRangePairs(text, regExp, timeLimitMs));
}

/**
 * Runs text.matchAll against an array of RegExps in a worker.
 * @param text - The text to search within.
 * @param regExps - An array of regular expressions to match against the text.
 * @param timeLimitMs - Optional time limit in milliseconds for the operation.
 */
export function crWorkerMatchAllArray(
    createRegExpWorker: CreateRegExpWorker,
    text: string,
    regExps: RegExp[],
    timeLimitMs?: number,
): Promise<MatchAllRegExpArrayResult> {
    return createAndApplyToWorker(createRegExpWorker, (worker) => worker.matchAllArray(text, regExps, timeLimitMs));
}

/**
 * Run RegExp.exec in a worker.
 * @param regExp - The regular expression to execute.
 * @param text - The text to search within.
 * @param timeLimitMs - Optional time limit in milliseconds for the operation.
 */
export function crWorkerExec(
    createRegExpWorker: CreateRegExpWorker,
    regExp: RegExp,
    text: string,
    timeLimitMs?: number,
): Promise<ExecRegExpResult> {
    return createAndApplyToWorker(createRegExpWorker, (worker) => worker.exec(regExp, text, timeLimitMs));
}

/**
 * Run text.match with a RegExp in a worker.
 * @param text - The text to search within.
 * @param regExp - The regular expression to match against the text.
 * @param timeLimitMs - Optional time limit in milliseconds for the operation.
 */
export function crWorkerMatch(
    createRegExpWorker: CreateRegExpWorker,
    text: string,
    regExp: RegExp,
    timeLimitMs?: number,
): Promise<MatchRegExpResult> {
    return createAndApplyToWorker(createRegExpWorker, (worker) => worker.match(text, regExp, timeLimitMs));
}
