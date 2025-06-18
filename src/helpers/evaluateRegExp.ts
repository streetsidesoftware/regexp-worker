import { measureExecution } from '../timer.js';

export interface ExecRegExpResult {
    elapsedTimeMs: number;
    matches: RegExpExecArray[];
}

export function execRegExp(regExp: RegExp, text: string): ExecRegExpResult {
    const { elapsedTimeMs, r: matches } = measureExecution(() => _execRegExp(regExp, text));
    return { elapsedTimeMs, matches };
}

interface ExecRegExpOnTextArray {
    regExp: RegExp;
    elapsedTimeMs: number;
    results: ExecRegExpResult[];
}

export interface ExecRegExpMatrixResult {
    elapsedTimeMs: number;
    matrix: ExecRegExpOnTextArray[];
}

export function execRegExpMatrix(regExpArray: RegExp[], textArray: string[]): ExecRegExpMatrixResult {
    const { elapsedTimeMs, r: matrix } = measureExecution(() => {
        return regExpArray.map((r) => execRegExpOnTextArray(r, textArray));
    });
    return { elapsedTimeMs, matrix };
}

export interface ExecRegExpArrayResult {
    elapsedTimeMs: number;
    results: ExecRegExpResult[];
}

export function execRegExpArray(regExpArray: RegExp[], text: string): ExecRegExpArrayResult {
    const { elapsedTimeMs, r: results } = measureExecution(() => {
        return regExpArray.map((r) => execRegExp(r, text));
    });
    return { elapsedTimeMs, results };
}

export function execRegExpOnTextArray(regExp: RegExp, texts: string[]): ExecRegExpOnTextArray {
    const { elapsedTimeMs, r: results } = measureExecution(() => {
        return texts.map((t) => execRegExp(regExp, t));
    });
    return { regExp, elapsedTimeMs, results };
}

export type RegExpOrString = RegExp | string;

export function toRegExp(r: RegExp | string, defaultFlags?: string): RegExp {
    if (isRegExp(r)) return r;

    const match = r.match(/^\/(.*)\/([gimsuy]*)$/);
    if (match) {
        return new RegExp(match[1], match[2] || defaultFlags);
    }
    return new RegExp(r, defaultFlags);
}

export function isRegExp(r: unknown): r is RegExp {
    return r instanceof RegExp;
}

function _execRegExp(regExp: RegExp, text: string): RegExpExecArray[] {
    const re = new RegExp(regExp);

    const results: RegExpExecArray[] = [];
    let lastPos = -1;
    let match;
    let retry = true;
    while ((match = re.exec(text))) {
        if (match.index === lastPos) {
            if (!re.global && retry) {
                break;
            }
            re.lastIndex = re.lastIndex + 1;
            retry = false;
            continue;
        }
        retry = true;
        lastPos = match.index;
        results.push(match);
    }

    return results;
}

/**
 * FlatRanges is an array of offsets into the matched text
 * Values at even indexes contains the start offset and the odd indexes contain the end offset (non-inclusive).
 * This method is used to improve data transfer between workers
 */
export type FlatRanges = Uint32Array;

export interface MatchRegExpResult {
    elapsedTimeMs: number;
    ranges: FlatRanges;
}

function mapExecRegExpResultToMatchRegExpResult(r: ExecRegExpResult): MatchRegExpResult {
    const ranges = new Uint32Array(r.matches.length * 2);
    let i = 0;
    for (const m of r.matches) {
        ranges[i++] = m.index;
        ranges[i++] = m.index + m[0].length;
    }
    return { elapsedTimeMs: r.elapsedTimeMs, ranges };
}

export function matchRegExp(text: string, regExp: RegExp): MatchRegExpResult {
    return mapExecRegExpResultToMatchRegExpResult(execRegExp(regExp, text));
}

export interface MatchRegExpArrayResult {
    elapsedTimeMs: number;
    results: MatchRegExpResult[];
}

export function matchRegExpArray(text: string, regExp: RegExp[]): MatchRegExpArrayResult {
    const { elapsedTimeMs, r: results } = measureExecution(() => {
        return regExp.map((r) => matchRegExp(text, r));
    });

    return { elapsedTimeMs, results };
}

export type Range = [number, number];

export function* flatRangesToRanges(flatRanges: FlatRanges): IterableIterator<Range> {
    for (let i = 0; i < flatRanges.length - 1; i += 2) {
        yield [flatRanges[i], flatRanges[i + 1]] as Range;
    }
}
