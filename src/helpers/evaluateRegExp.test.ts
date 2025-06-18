/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, test, expect } from 'vitest';
import type { ExecRegExpResult, FlatRanges } from './evaluateRegExp.js';
import {
    execRegExp,
    toRegExp,
    execRegExpMatrix,
    execRegExpArray,
    flatRangesToRanges,
    matchRegExp,
    matchRegExpArray,
} from './evaluateRegExp.js';
import * as fs from 'fs';

describe('EvaluateRegExp', () => {
    const text = `
This is a bit of text for everyone to read.

How about this?

Some more cool text.

Numbers: 1, 2, 3, 4, 1000, -55.0, 1.34e2
const x2 = 'hello';
`;
    const code = fs.readFileSync(new URL(import.meta.url), 'utf8');
    const w = (result: ExecRegExpResult) => resultsToTexts(result.matches);

    test('evaluateRegExp', () => {
        const words = w(execRegExp(/\w+/g, text));
        expect(words).toEqual(
            text
                .split(/\b/g)
                .map((s) => s.replace(/[^\w]/g, ''))
                .filter(notEmpty),
        );
        const wordBreaks = execRegExp(/\b/g, text).matches;
        expect(wordBreaks.map((r) => r.index).slice(0, 5)).toEqual([1, 5, 6, 8, 9]);
        const startOfWords = execRegExp(/\b(?=\w)/g, text).matches;
        expect(startOfWords.map((r) => r.index).slice(0, 5)).toEqual([1, 6, 9, 11, 15]);
        const singleWord = execRegExp(/about/, text);
        expect(w(singleWord)).toEqual(['about']);
    });

    test('toRegExp', () => {
        expect(toRegExp(/./g).toString()).toBe(/./g.toString());
        expect(toRegExp(/./g.toString())).toEqual(/./g);
        expect(toRegExp('hello')).toEqual(/hello/);
        expect(toRegExp('hello.')).toEqual(/hello./);
        expect(toRegExp('hello*')).toEqual(/hello*/);
    });

    test('execRegExpMatrix', () => {
        const empty = execRegExpMatrix([], []);
        expect(empty).toEqual(
            expect.objectContaining({
                elapsedTimeMs: expect.any(Number),
                matrix: expect.arrayContaining([]),
            }),
        );
        const result = execRegExpMatrix([/\bt\w+/g, /\d+/g, /execRegExpMatrix.*/], [text, code]);
        expect(result.elapsedTimeMs).toBeGreaterThan(0);
        expect(result.matrix).toEqual(expect.any(Array));
        expect(result.matrix).toHaveLength(3);
        expect(result.matrix[0].regExp).toEqual(/\bt\w+/g);
        expect(result.matrix[2].results).toHaveLength(2);
        expect(result.matrix[2].results[1].matches).toHaveLength(1);
    });

    test('execRegExpArray', () => {
        const r = execRegExpArray([/\w+/g], text);
        expect(r.results.map((r) => r.matches).map(resultsToTexts)).toEqual([w(execRegExp(/\w+/g, text))]);
    });

    test('matchRegExp', () => {
        const r = matchRegExp(text, /\w+/g);
        const words = [...flatRangesToTexts(r.ranges, text)];
        expect(words).toEqual(
            text
                .split(/\b/g)
                .map((s) => s.replace(/[^\w]/g, ''))
                .filter(notEmpty),
        );
        expect(r.elapsedTimeMs).toBeGreaterThan(0);
        expect(r.elapsedTimeMs).toBeLessThan(100);
    });

    test('matchRegExpArray', () => {
        const regExps = [/\w+/g, /\d+/g];
        const r = matchRegExpArray(text, regExps);
        expect(r.elapsedTimeMs).toBeGreaterThan(0);
        expect(r.elapsedTimeMs).toBeLessThan(100);
        expect(r.elapsedTimeMs).toBeGreaterThan(r.results.map((a) => a.elapsedTimeMs).reduce((a, b) => a + b, 0));
        for (let i = 0; i < r.results.length; ++i) {
            const result = r.results[i];
            const regexp = regExps[i];
            expect(result.elapsedTimeMs).toBeGreaterThan(0);
            expect(result.elapsedTimeMs).toBeLessThan(100);
            const expectedWords = w(execRegExp(regexp, text));
            const words = [...flatRangesToTexts(result.ranges, text)];
            expect(words).toEqual(expectedWords);
        }
    });
});

function notEmpty<T>(v: T | null | undefined | '' | 0): v is T {
    return !!v;
}

function regExpExecArrayToText(match: RegExpExecArray): string {
    return match[0];
}

function resultsToTexts(matches: RegExpExecArray[]): string[] {
    return matches.map(regExpExecArrayToText);
}

function* flatRangesToTexts(ranges: FlatRanges, text: string): IterableIterator<string> {
    for (const [start, end] of flatRangesToRanges(ranges)) {
        yield text.slice(start, end);
    }
}
