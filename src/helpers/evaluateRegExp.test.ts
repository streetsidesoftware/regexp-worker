/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { describe, expect, test } from 'vitest';

import type { FlatRanges, MatchAllRegExpResult } from './evaluateRegExp.js';
import {
    execRegExp,
    flatRangesToRanges,
    matchAllRegExp,
    matchAllRegExpArray,
    matchAllToRangesRegExp,
    matchAllToRangesRegExpArray,
    toRegExp,
} from './evaluateRegExp.js';

describe('EvaluateRegExp', () => {
    const text = `
This is a bit of text for everyone to read.

How about this?

Some more cool text.

Numbers: 1, 2, 3, 4, 1000, -55.0, 1.34e2
const x2 = 'hello';
`;
    // const code = fs.readFileSync(new URL(import.meta.url), 'utf8');
    const w = (result: MatchAllRegExpResult): string[] => resultsToTexts(result.matches);

    test('matchAllRegExp', () => {
        const words = w(matchAllRegExp(text, /\w+/g));
        expect(words).toEqual(
            text
                .split(/\b/g)
                .map((s) => s.replace(/[^\w]/g, ''))
                .filter(notEmpty),
        );
        const wordBreaks = matchAllRegExp(text, /\b/g).matches;
        expect(wordBreaks.map((r) => r.index).slice(0, 5)).toEqual([1, 5, 6, 8, 9]);
        const startOfWords = matchAllRegExp(text, /\b(?=\w)/g).matches;
        expect(startOfWords.map((r) => r.index).slice(0, 5)).toEqual([1, 6, 9, 11, 15]);
        const singleWord = matchAllRegExp(text, /about/);
        expect(w(singleWord)).toEqual(['about']);
    });

    test.each`
        regExp                                              | expected      | expectedLastIndex
        ${/./g}                                             | ${/./g}       | ${0}
        ${/./gu}                                            | ${/./gu}      | ${0}
        ${{ source: 'hello*', flags: 'gu' }}                | ${/hello*/gu} | ${0}
        ${{ source: 'hello*', flags: 'gu', lastIndex: 10 }} | ${/hello*/gu} | ${10}
        ${{ source: 'hello*', flags: '' }}                  | ${/hello*/}   | ${0}
    `('toRegExp $regExp', ({ regExp, expected, expectedLastIndex }) => {
        const reg = toRegExp(regExp);
        expect(reg).toEqual(expected);
        expect(reg.lastIndex).toBe(expectedLastIndex);
    });

    test.each`
        regExp                                                                   | expected
        ${{ source: undefined, flags: 'gu', lastIndex: 10 }}                     | ${TypeError('Invalid RegExp.')}
        ${{ source: '', flags: 4, lastIndex: 10 }}                               | ${SyntaxError("Invalid flags supplied to RegExp constructor '4'")}
        ${null}                                                                  | ${expect.any(TypeError)}
        ${'(.'}                                                                  | ${TypeError('Invalid RegExp.')}
        ${{ source: 'hello*', flags: 'gux', lastIndex: 10 }}                     | ${SyntaxError("Invalid flags supplied to RegExp constructor 'gux'")}
        ${{ source: '\nh.* # Match anything starting with `h`\n', flags: 'gx' }} | ${SyntaxError("Invalid flags supplied to RegExp constructor 'gx'")}
        ${{ source: '\nh.* # Use last index 10\n', flags: 'gx', lastIndex: 10 }} | ${SyntaxError("Invalid flags supplied to RegExp constructor 'gx'")}
    `('toRegExp Error $regExp', ({ regExp, expected }) => {
        expect(() => toRegExp(regExp)).toThrowError(expected);
    });

    test('matchAllRegExpArray', () => {
        const r = matchAllRegExpArray(text, [/\w+/g]);
        expect(r.results.map((r) => r.matches).map(resultsToTexts)).toEqual([w(matchAllRegExp(text, /\w+/g))]);
    });

    test('matchAllToRangesRegExp', () => {
        const r = matchAllToRangesRegExp(text, /\w+/g);
        const words = [...flatRangesToTexts(r.ranges, text)];
        expect(words).toEqual(Array.from(text.matchAll(/\w+/g), (m) => regExpExecArrayToText(m)));
        expect(r.elapsedTimeMs).toBeGreaterThan(0);
        expect(r.elapsedTimeMs).toBeLessThan(100);
    });

    test('matchRegExpArray', () => {
        const regExps = [/\w+/g, /\d+/g];
        const r = matchAllToRangesRegExpArray(text, regExps);
        expect(r.elapsedTimeMs).toBeGreaterThan(0);
        expect(r.elapsedTimeMs).toBeLessThan(100);
        expect(r.elapsedTimeMs).toBeGreaterThan(r.results.map((a) => a.elapsedTimeMs).reduce((a, b) => a + b, 0));
        for (let i = 0; i < r.results.length; ++i) {
            const result = r.results[i];
            const regexp = regExps[i];
            expect(result.elapsedTimeMs).toBeGreaterThan(0);
            expect(result.elapsedTimeMs).toBeLessThan(100);
            const expectedWords = w(matchAllRegExp(text, regexp));
            const words = [...flatRangesToTexts(result.ranges, text)];
            expect(words).toEqual(expectedWords);
        }
    });

    test.each`
        regExp       | expected             | expectedLastIndex
        ${/\w+/g}    | ${/\w+/g.exec(text)} | ${5}
        ${/\d{8,}/g} | ${null}              | ${0}
    `('execRegExp $regExp', ({ regExp, expected, expectedLastIndex }) => {
        const r = execRegExp(regExp, text);
        expect(r.match).toEqual(expected);
        expect(r.lastIndex).toBe(expectedLastIndex);
    });
});

function notEmpty<T>(v: T | null | undefined | '' | 0): v is T {
    return !!v;
}

function regExpExecArrayToText(match: RegExpExecArray): string {
    return match[0];
}

function regExpMatchArrayToText(match: RegExpMatchArray): string {
    return match[0];
}

function resultsToTexts(matches: RegExpMatchArray[]): string[] {
    return matches.map(regExpMatchArrayToText);
}

function* flatRangesToTexts(ranges: FlatRanges, text: string): IterableIterator<string> {
    for (const [start, end] of flatRangesToRanges(ranges)) {
        yield text.slice(start, end);
    }
}
