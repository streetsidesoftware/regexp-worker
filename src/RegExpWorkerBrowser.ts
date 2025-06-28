import type {
    ExecRegExpResult,
    MatchAllAsRangePairsResult,
    MatchAllRegExpArrayResult,
    MatchAllRegExpResult,
    MatchRegExpResult,
} from './RegExpWorker.js';
import {
    crWorkerExec,
    crWorkerMatch,
    crWorkerMatchAll,
    crWorkerMatchAllArray,
    crWorkerMatchAllAsRangePairs,
    RegExpWorkerBase,
} from './RegExpWorker.js';
import { createWorkerBrowser } from './worker/workerBrowser.js';

export type { RegExpLike } from './helpers/regexp.js';
export { toRegExp } from './helpers/regexp.js';
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
        super(createWorkerBrowser, timeoutMs, stopIdleWorkerAfterMs);
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
export function workerMatchAll(text: string, regExp: RegExp, timeLimitMs?: number): Promise<MatchAllRegExpResult> {
    return crWorkerMatchAll(createRegExpWorker, text, regExp, timeLimitMs);
}

/**
 * Run text.matchAll against a RegExp in a worker and return the matches as [start, end] range pairs.
 * @param text - The text to search within.
 * @param regExp - The regular expression to match against the text.
 * @param timeLimitMs - Optional time limit in milliseconds for the operation.
 */
export function workerMatchAllAsRangePairs(text: string, regExp: RegExp, timeLimitMs?: number): Promise<MatchAllAsRangePairsResult> {
    return crWorkerMatchAllAsRangePairs(createRegExpWorker, text, regExp, timeLimitMs);
}

/**
 * Runs text.matchAll against an array of RegExps in a worker.
 * @param text - The text to search within.
 * @param regExps - An array of regular expressions to match against the text.
 * @param timeLimitMs - Optional time limit in milliseconds for the operation.
 */
export function workerMatchAllArray(text: string, regExps: RegExp[], timeLimitMs?: number): Promise<MatchAllRegExpArrayResult> {
    return crWorkerMatchAllArray(createRegExpWorker, text, regExps, timeLimitMs);
}

/**
 * Run RegExp.exec in a worker.
 * @param regExp - The regular expression to execute.
 * @param text - The text to search within.
 * @param timeLimitMs - Optional time limit in milliseconds for the operation.
 */
export function workerExec(regExp: RegExp, text: string, timeLimitMs?: number): Promise<ExecRegExpResult> {
    return crWorkerExec(createRegExpWorker, regExp, text, timeLimitMs);
}

/**
 * Run text.match with a RegExp in a worker.
 * @param text - The text to search within.
 * @param regExp - The regular expression to match against the text.
 * @param timeLimitMs - Optional time limit in milliseconds for the operation.
 */
export function workerMatch(text: string, regExp: RegExp, timeLimitMs?: number): Promise<MatchRegExpResult> {
    return crWorkerMatch(createRegExpWorker, text, regExp, timeLimitMs);
}
