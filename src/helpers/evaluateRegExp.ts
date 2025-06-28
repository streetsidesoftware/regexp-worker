import { measureExecution } from '../timer.js';
import type { RegExpLike } from './regexp.js';

export interface MatchAllRegExpResult {
    elapsedTimeMs: number;
    matches: RegExpMatchArray[];
}

/**
 * Returns a timed version of String.prototype.matchAll
 * @param text
 * @param regExp
 * @returns
 */
export function matchAllRegExp(text: string, regExp: RegExp): MatchAllRegExpResult {
    const { elapsedTimeMs, r } = measureExecution(() => Array.from(doMatchAllRegExp(regExp, text)));
    return { elapsedTimeMs, matches: r };
}

export interface ExecRegExpResult {
    elapsedTimeMs: number;
    lastIndex: number;
    match: RegExpExecArray | null;
}

/**
 * Returns a timed version of RegExp.exec
 * @param regExp
 * @param text
 * @returns
 */
export function execRegExp(regExp: RegExp, text: string): ExecRegExpResult {
    const { elapsedTimeMs, r: match } = measureExecution(() => doExecRegExp(regExp, text));
    return { elapsedTimeMs, lastIndex: regExp.lastIndex, match };
}

export interface MatchRegExpResult {
    elapsedTimeMs: number;
    lastIndex: number;
    match: RegExpMatchArray | null;
}

/**
 * Returns a timed version of String.prototype.match
 * @param text
 * @param regExp
 * @returns
 */
export function matchRegExp(text: string, regExp: RegExp): MatchRegExpResult {
    const { elapsedTimeMs, r: match } = measureExecution(() => doMatchRegExp(regExp, text));
    return { elapsedTimeMs, lastIndex: regExp.lastIndex, match };
}

export interface MatchAllRegExpArrayResult {
    elapsedTimeMs: number;
    results: MatchAllRegExpResult[];
}

/**
 * Returns a timed version of matchAllRegExp for an array of regular expressions
 * @param text
 * @param regExpArray
 * @returns
 */
export function matchAllRegExpArray(text: string, regExpArray: RegExp[]): MatchAllRegExpArrayResult {
    const { elapsedTimeMs, r: results } = measureExecution(() => {
        return regExpArray.map((r) => matchAllRegExp(text, r));
    });
    return { elapsedTimeMs, results };
}

/**
 * Converts a RegExp or RegExpLike object to a RegExp object.
 * If the input is a RegExp, it is returned as is.
 * If the input is a RegExpLike object, it should have `source` and `flags` properties.
 * The `x` flag is NOT supported and will throw an error if present.
 * @param regexp
 * @param defaultFlags
 * @returns
 */
export function toRegExp(regexp: RegExp | RegExpLike): RegExp {
    if (regexp instanceof RegExp) return regexp;

    const { source, flags } = regexp;
    if (typeof source !== 'string') {
        throw new TypeError('Invalid RegExp.');
    }
    const reg = new RegExp(source, flags);
    if (regexp.lastIndex !== undefined) {
        reg.lastIndex = regexp.lastIndex;
    }
    return reg;
}

function doExecRegExp(regExp: RegExp, text: string): RegExpExecArray | null {
    return regExp.exec(text);
}

function doMatchAllRegExp(regExp: RegExp, text: string): RegExpStringIterator<RegExpMatchArray> {
    return regExp[Symbol.matchAll](text);
}

function doMatchRegExp(regExp: RegExp, text: string): RegExpMatchArray | null {
    return text.match(regExp);
}

/**
 * FlatRanges is an array of offsets into the matched text
 * Values at even indexes contains the start offset and the odd indexes contain the end offset (non-inclusive).
 * This method is used to improve data transfer between workers
 */
export type FlatRanges = Uint32Array;

export interface MatchAllToRangesRegExpResult {
    elapsedTimeMs: number;
    ranges: FlatRanges;
}

function toRanges(r: MatchAllRegExpResult): MatchAllToRangesRegExpResult {
    const ranges = new Uint32Array(r.matches.length * 2);
    let i = 0;
    for (const m of r.matches) {
        const index = m.index || 0;
        ranges[i++] = index;
        ranges[i++] = index + m[0].length;
    }
    return { elapsedTimeMs: r.elapsedTimeMs, ranges };
}

export function matchAllToRangesRegExp(text: string, regExp: RegExp): MatchAllToRangesRegExpResult {
    return toRanges(matchAllRegExp(text, regExp));
}

export interface MatchAllToRangesRegExpArrayResult {
    elapsedTimeMs: number;
    results: MatchAllToRangesRegExpResult[];
}

export function matchAllToRangesRegExpArray(text: string, regExp: RegExp[]): MatchAllToRangesRegExpArrayResult {
    const { elapsedTimeMs, r: results } = measureExecution(() => {
        return regExp.map((r) => matchAllToRangesRegExp(text, r));
    });

    return { elapsedTimeMs, results };
}

export type Range = [number, number];

export function* flatRangesToRanges(flatRanges: FlatRanges): IterableIterator<Range> {
    for (let i = 0; i < flatRanges.length - 1; i += 2) {
        yield [flatRanges[i], flatRanges[i + 1]] as Range;
    }
}
