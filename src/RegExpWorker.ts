import type { ExecRegExpResult, MatchAllRegExpArrayResult, MatchRegExpResult } from './helpers/evaluateRegExp.js';
import { type MatchAllRegExpResult } from './helpers/evaluateRegExp.js';
import type { RequestMatchRegExp } from './Procedures/index.js';
import {
    type RequestExecRegExp,
    type RequestMatchAllRegExp,
    type RequestMatchAllRegExpArray,
    type Response,
    createRequestExecRegExp,
    createRequestMatchAllRegExp,
    createRequestMatchRegExp,
    createRequestMatchRegExpArray,
} from './Procedures/index.js';
import { Scheduler } from './scheduler/index.js';
import { isTimeoutErrorLike, TimeoutError } from './TimeoutError.js';
import { createWorkerNode } from './worker/workerNode.js';

export { toRegExp } from './helpers/evaluateRegExp.js';
export type { ExecRegExpResult, MatchAllRegExpArrayResult, MatchRegExpResult, MatchAllRegExpResult } from './helpers/evaluateRegExp.js';

export class RegExpWorker {
    private scheduler: Scheduler;
    public dispose: () => Promise<void> = () => this._dispose();

    constructor(timeoutMs?: number) {
        this.scheduler = new Scheduler(createWorkerNode, timeoutMs);
    }

    public exec(regExp: RegExp, text: string, timeLimitMs?: number): Promise<ExecRegExpResult> {
        const req = createRequestExecRegExp({ regexp: regExp, text });
        return this.makeRequest(req, timeLimitMs);
    }

    public matchAll(text: string, regExp: RegExp, timeLimitMs?: number): Promise<MatchAllRegExpResult> {
        const req = createRequestMatchAllRegExp({ regexp: regExp, text });
        return this.makeRequest(req, timeLimitMs);
    }

    public match(text: string, regExp: RegExp, timeLimitMs?: number): Promise<MatchRegExpResult> {
        const req = createRequestMatchRegExp({ regexp: regExp, text });
        return this.makeRequest(req, timeLimitMs);
    }

    public matchAllArray(text: string, regExp: RegExp[], timeLimitMs?: number): Promise<MatchAllRegExpArrayResult> {
        const req = createRequestMatchRegExpArray({ regexps: regExp, text });
        return this.makeRequest(req, timeLimitMs);
    }

    private makeRequest(req: RequestExecRegExp, timeLimitMs: number | undefined): Promise<ExecRegExpResult>;
    private makeRequest(req: RequestMatchRegExp, timeLimitMs: number | undefined): Promise<MatchRegExpResult>;
    private makeRequest(req: RequestMatchAllRegExp, timeLimitMs: number | undefined): Promise<MatchAllRegExpResult>;
    private makeRequest(req: RequestMatchAllRegExpArray, timeLimitMs: number | undefined): Promise<MatchAllRegExpArrayResult>;
    private makeRequest(
        req: RequestExecRegExp | RequestMatchAllRegExp | RequestMatchRegExp | RequestMatchAllRegExpArray,
        timeLimitMs: number | undefined,
    ): Promise<ExecRegExpResult> | Promise<MatchRegExpResult> | Promise<MatchAllRegExpResult> | Promise<MatchAllRegExpArrayResult> {
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
