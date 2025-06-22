import type {
    ExecRegExpResult,
    MatchAllRegExpArrayResult,
    MatchAllToRangesRegExpResult,
    MatchRegExpResult,
} from './helpers/evaluateRegExp.js';
import { type MatchAllRegExpResult } from './helpers/evaluateRegExp.js';
import type { RequestMatchRegExp } from './Procedures/index.js';
import {
    type RequestExecRegExp,
    type RequestMatchAllRegExp,
    type RequestMatchAllRegExpArray,
    type RequestMatchAllRegExpAsRange,
    type Response,
    createRequestExecRegExp,
    createRequestMatchAllRegExp,
    createRequestMatchRegExp,
    createRequestMatchRegExpArray,
} from './Procedures/index.js';
import { createRequestMatchAllRegExpAsRange } from './Procedures/procMatchAllRegExpAsRange.js';
import { Scheduler } from './scheduler/index.js';
import { isTimeoutErrorLike, TimeoutError } from './TimeoutError.js';
import type { CreateWorker } from './worker/di.js';
import { createWorker as defaultCreateWorker } from './worker/di.js';

export { toRegExp } from './helpers/evaluateRegExp.js';
export type { ExecRegExpResult, MatchAllRegExpArrayResult, MatchAllRegExpResult, MatchRegExpResult } from './helpers/evaluateRegExp.js';

export class RegExpWorker {
    private scheduler: Scheduler;
    public dispose: () => Promise<void> = () => this._dispose();

    constructor(timeoutMs?: number, createWorker: CreateWorker = defaultCreateWorker) {
        this.scheduler = new Scheduler(createWorker, timeoutMs);
    }

    /**
     * Run RegExp.exec in a worker.
     * @param regExp - The regular expression to execute.
     * @param text - The text to search within.
     * @param timeLimitMs - Optional time limit in milliseconds for the operation.
     */
    public exec(regExp: RegExp, text: string, timeLimitMs?: number): Promise<ExecRegExpResult> {
        const req = createRequestExecRegExp({ regexp: regExp, text });
        return this.makeRequest(req, timeLimitMs);
    }

    /**
     * Run text.matchAll against a RegExp in a worker.
     * @param text - The text to search within.
     * @param regExp - The regular expression to match against the text.
     * @param timeLimitMs - Optional time limit in milliseconds for the operation.
     */
    public matchAll(text: string, regExp: RegExp, timeLimitMs?: number): Promise<MatchAllRegExpResult> {
        const req = createRequestMatchAllRegExp({ regexp: regExp, text });
        return this.makeRequest(req, timeLimitMs);
    }

    /**
     * Run text.match with a RegExp in a worker.
     * @param text - The text to search within.
     * @param regExp - The regular expression to match against the text.
     * @param timeLimitMs - Optional time limit in milliseconds for the operation.
     */
    public match(text: string, regExp: RegExp, timeLimitMs?: number): Promise<MatchRegExpResult> {
        const req = createRequestMatchRegExp({ regexp: regExp, text });
        return this.makeRequest(req, timeLimitMs);
    }

    /**
     * Runs text.matchAll against an array of RegExps in a worker.
     * @param text - The text to search within.
     * @param regExps - An array of regular expressions to match against the text.
     * @param timeLimitMs - Optional time limit in milliseconds for the operation.
     */
    public matchAllArray(text: string, regExp: RegExp[], timeLimitMs?: number): Promise<MatchAllRegExpArrayResult> {
        const req = createRequestMatchRegExpArray({ regexps: regExp, text });
        return this.makeRequest(req, timeLimitMs);
    }

    /**
     * Runs text.matchAll against an array of RegExps in a worker.
     * @param text - The text to search within.
     * @param regExps - An array of regular expressions to match against the text.
     * @param timeLimitMs - Optional time limit in milliseconds for the operation.
     */
    public async matchAllAsRangePairs(text: string, regexp: RegExp, timeLimitMs?: number): Promise<MatchAllAsRangePairsResult> {
        const req = createRequestMatchAllRegExpAsRange({ regexp, text });
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
 * Run text.matchAll against a RegExp in a worker.
 * @param text - The text to search within.
 * @param regExp - The regular expression to match against the text.
 * @param timeLimitMs - Optional time limit in milliseconds for the operation.
 */
export async function workerMatchAll(text: string, regExp: RegExp, timeLimitMs?: number): Promise<MatchAllRegExpResult> {
    const worker = new RegExpWorker();
    return await worker.matchAll(text, regExp, timeLimitMs);
}

/**
 * Run text.matchAll against a RegExp in a worker and return the matches as [start, end] range pairs.
 * @param text - The text to search within.
 * @param regExp - The regular expression to match against the text.
 * @param timeLimitMs - Optional time limit in milliseconds for the operation.
 */
export async function workerMatchAllAsRangePairs(text: string, regExp: RegExp, timeLimitMs?: number): Promise<MatchAllAsRangePairsResult> {
    const worker = new RegExpWorker();
    return await worker.matchAllAsRangePairs(text, regExp, timeLimitMs);
}

/**
 * Runs text.matchAll against an array of RegExps in a worker.
 * @param text - The text to search within.
 * @param regExps - An array of regular expressions to match against the text.
 * @param timeLimitMs - Optional time limit in milliseconds for the operation.
 */
export async function workerMatchAllArray(text: string, regExps: RegExp[], timeLimitMs?: number): Promise<MatchAllRegExpArrayResult> {
    const worker = new RegExpWorker();
    return await worker.matchAllArray(text, regExps, timeLimitMs);
}

/**
 * Run RegExp.exec in a worker.
 * @param regExp - The regular expression to execute.
 * @param text - The text to search within.
 * @param timeLimitMs - Optional time limit in milliseconds for the operation.
 */
export async function workerExec(regExp: RegExp, text: string, timeLimitMs?: number): Promise<ExecRegExpResult> {
    const worker = new RegExpWorker();
    return await worker.exec(regExp, text, timeLimitMs);
}

/**
 * Run text.match with a RegExp in a worker.
 * @param text - The text to search within.
 * @param regExp - The regular expression to match against the text.
 * @param timeLimitMs - Optional time limit in milliseconds for the operation.
 */
export async function workerMatch(text: string, regExp: RegExp, timeLimitMs?: number): Promise<MatchRegExpResult> {
    const worker = new RegExpWorker();
    return await worker.match(text, regExp, timeLimitMs);
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
