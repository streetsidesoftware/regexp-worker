import type {
    ExecRegExpResult,
    MatchAllAsRangePairsResult,
    MatchAllRegExpArrayResult,
    MatchAllRegExpResult,
    MatchRegExpResult,
} from './RegExpWorker.js';
import { RegExpWorkerBase as RegExpWorkerBase } from './RegExpWorker.js';
import { createWorkerNode } from './worker/workerNode.js';

export { toRegExp } from './helpers/evaluateRegExp.js';
export type {
    ExecRegExpResult,
    MatchAllAsRangePairsResult,
    MatchAllRegExpArrayResult,
    MatchAllRegExpResult,
    MatchRegExpResult,
    RangePair,
} from './RegExpWorker.js';

export class RegExpWorker extends RegExpWorkerBase {
    /**
     * Create a new RegExpWorker instance.
     * @param timeoutMs - Optional time limit in milliseconds for each request execution. Default is 1000ms.
     * @param stopIdleWorkerAfterMs - Optional time in milliseconds to wait after processing the last request before stopping the worker. Default is 200ms.
     */
    constructor(timeoutMs?: number, stopIdleWorkerAfterMs?: number) {
        super(createWorkerNode, timeoutMs, stopIdleWorkerAfterMs);
    }
}

export function createRegExpWorker(timeoutMs?: number, stopIdleWorkerAfterMs?: number): RegExpWorker {
    return new RegExpWorker(timeoutMs, stopIdleWorkerAfterMs);
}

/**
 * Run text.matchAll against a RegExp in a worker.
 * @param text - The text to search within.
 * @param regExp - The regular expression to match against the text.
 * @param timeLimitMs - Optional time limit in milliseconds for the operation.
 */
export async function workerMatchAll(text: string, regExp: RegExp, timeLimitMs?: number): Promise<MatchAllRegExpResult> {
    const worker = createRegExpWorker();
    return await worker.matchAll(text, regExp, timeLimitMs);
}

/**
 * Run text.matchAll against a RegExp in a worker and return the matches as [start, end] range pairs.
 * @param text - The text to search within.
 * @param regExp - The regular expression to match against the text.
 * @param timeLimitMs - Optional time limit in milliseconds for the operation.
 */
export async function workerMatchAllAsRangePairs(text: string, regExp: RegExp, timeLimitMs?: number): Promise<MatchAllAsRangePairsResult> {
    const worker = createRegExpWorker();
    return await worker.matchAllAsRangePairs(text, regExp, timeLimitMs);
}

/**
 * Runs text.matchAll against an array of RegExps in a worker.
 * @param text - The text to search within.
 * @param regExps - An array of regular expressions to match against the text.
 * @param timeLimitMs - Optional time limit in milliseconds for the operation.
 */
export async function workerMatchAllArray(text: string, regExps: RegExp[], timeLimitMs?: number): Promise<MatchAllRegExpArrayResult> {
    const worker = createRegExpWorker();
    return await worker.matchAllArray(text, regExps, timeLimitMs);
}

/**
 * Run RegExp.exec in a worker.
 * @param regExp - The regular expression to execute.
 * @param text - The text to search within.
 * @param timeLimitMs - Optional time limit in milliseconds for the operation.
 */
export async function workerExec(regExp: RegExp, text: string, timeLimitMs?: number): Promise<ExecRegExpResult> {
    const worker = createRegExpWorker();
    return await worker.exec(regExp, text, timeLimitMs);
}

/**
 * Run text.match with a RegExp in a worker.
 * @param text - The text to search within.
 * @param regExp - The regular expression to match against the text.
 * @param timeLimitMs - Optional time limit in milliseconds for the operation.
 */
export async function workerMatch(text: string, regExp: RegExp, timeLimitMs?: number): Promise<MatchRegExpResult> {
    const worker = createRegExpWorker();
    return await worker.match(text, regExp, timeLimitMs);
}
