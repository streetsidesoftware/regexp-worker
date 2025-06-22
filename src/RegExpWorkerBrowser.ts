import type {
    ExecRegExpResult,
    MatchAllAsRangePairsResult,
    MatchAllRegExpArrayResult,
    MatchAllRegExpResult,
    MatchRegExpResult,
} from './RegExpWorker.js';
import { RegExpWorkerBase } from './RegExpWorker.js';
import { createWorkerBrowser } from './worker/workerBrowser.js';

export { toRegExp } from './helpers/evaluateRegExp.js';
export type { ExecRegExpResult, MatchAllRegExpArrayResult, MatchAllRegExpResult, MatchRegExpResult, RangePair } from './RegExpWorker.js';

export class RegExpWorker extends RegExpWorkerBase {
    constructor(timeoutMs?: number) {
        super(createWorkerBrowser, timeoutMs);
    }
}

export function createRegExpWorker(timeoutMs?: number): RegExpWorker {
    return new RegExpWorker(timeoutMs);
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
