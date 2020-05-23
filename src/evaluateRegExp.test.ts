import { execRegExp, ExecRegExpResult } from './evaluateRegExp';

describe('EvaluateRegExp', () => {
    const text = `
This is a bit of text for everyone to read.

How about this?

Some more cool text.

Numbers: 1, 2, 3, 4, 1000, -55.0, 1.34e2
const x2 = 'hello';
`
    const w = (result: ExecRegExpResult) => matchesToText(result.matches);

    test('evaluateRegExp', () => {
        const words = w(execRegExp(/\w+/g, text));
        expect(words).toEqual(text.split(/\b/g).map(s => s.replace(/[^\w]/g, '')).filter(notEmpty));
        const wordBreaks = execRegExp(/\b/g, text).matches;
        expect(wordBreaks.map(r => r.index).slice(0, 5)).toEqual([1, 5, 6, 8, 9]);
        const startOfWords = execRegExp(/\b(?=\w)/g, text).matches;
        expect(startOfWords.map(r => r.index).slice(0, 5)).toEqual([1, 6, 9, 11, 15]);
        const singleWord = execRegExp(/about/, text);
        expect(w(singleWord)).toEqual(['about']);
    });

    // test('evaluateNamedRegularExpressions', () => {
    //     const exp = [
    //         { name: 'words', regExp: '/[a-z]+/gi' },
    //         { name: 'numbers', regExp: /[+\-]?(?:\.\d+|(?:\d+(?:\.\d+)?(e\d+)?))/g },
    //         { name: 'digits', regExp: /[0-9]+/g },
    //         { name: 'Words', regExp: /[A-Z][a-z]+/g },
    //         { name: 'First Word', regExp: '[A-Z][a-z]+' },
    //     ];

    //     const r = evaluateNamedRegularExpressions(text, exp);
    //     const rr = new Map(r.entries
    //         .map(e => ({ name: e.name, words: extractRanges(text, e.ranges) }))
    //         .map(e => [e.name, e.words]));
    //     expect(r.elapsedTimeMs).toBeLessThan(1000);
    //     expect(r.entries).toHaveLength(5);
    //     expect([...rr]).toHaveLength(5);
    //     const firstWord = rr.get('First Word');
    //     expect(firstWord?.[0]).toBe('This');
    //     expect(rr.get('Words')).toEqual(['This', 'How', 'Some', 'Numbers']);
    // });

});

function notEmpty<T>(v: T | null | undefined | '' | 0): v is T {
    return !!v;
}

function matchToText(match: RegExpExecArray): string {
    return match[0];
}

function matchesToText(matches: RegExpExecArray[]): string[] {
    return matches.map(matchToText);
}
