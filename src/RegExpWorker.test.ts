/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import fs from 'node:fs/promises';

import { describe, expect, test } from 'vitest';

import { catchErrors } from './helpers/errors.js';
import type { RegExpWorkerBase } from './RegExpWorker.js';
import { createRegExpWorker, timeoutRejection } from './RegExpWorker.js';
import { TimeoutError } from './TimeoutError.js';
import { createWorkerNode } from './worker/workerNode.js';

function cr(timeoutMs?: number): RegExpWorkerBase {
    return createRegExpWorker(createWorkerNode, timeoutMs);
}

interface CustomMatchers<R = unknown> {
    toBeWithin: (floor: number, ceiling: number) => R;
}

declare module 'vitest' {
    // eslint-disable-next-line  @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
    interface Matchers<T = any> extends CustomMatchers<T> {}
}

expect.extend({
    toBeWithin(received, floor, ceiling) {
        const pass = received >= floor && received <= ceiling;
        if (pass) {
            return { message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`, pass };
        } else {
            return { message: () => `expected ${received} to be within range ${floor} - ${ceiling}`, pass };
        }
    },
});

// cspell:ignore hellothere

describe('RegExpWorker', () => {
    test.each`
        text               | regexp      | expected
        ${'hello\nthere'}  | ${/\w/g}    | ${'hellothere'.split('')}
        ${'Good Morning'}  | ${/\b\w+/g} | ${['Good', 'Morning']}
        ${'Good Morning.'} | ${/Good/}   | ${['Good']}
        ${'Good Morning.'} | ${/\b\w+/g} | ${['Good', 'Morning']}
    `('matchAll $test $regexp', async ({ text, regexp, expected }) => {
        await using worker = cr();
        const r = await worker.matchAll(text, regexp);
        expect(r.matches.map((m) => m[0])).toEqual(expected);
        expect(r.elapsedTimeMs).toBeGreaterThan(0);
    });

    test(
        'set timeout',
        run((worker) => {
            expect(worker.timeout).toBeGreaterThan(0);
            worker.timeout = 5.2;
            expect(worker.timeout).toBe(5.2);
            worker.timeout = 0;
            expect(worker.timeout).toBe(0);
        }),
    );

    test(
        'very slow regexp',
        run(async (worker) => {
            const r = worker.matchAll('x'.repeat(30), /(x+x+)+y/, 5);
            return expect(r).rejects.toEqual(
                expect.objectContaining({ elapsedTimeMs: expect.toBeWithin(3, 50), message: expect.stringContaining('Request Timeout') }),
            );
        }),
    );

    test('workerMatchAll', async () => {
        const response = await cr().matchAll('Good Morning', /\b\w+/g);
        expect(response.matches.map((m) => m[0])).toEqual(['Good', 'Morning']);
    });

    test('workerMatchAll on word boundaries', async () => {
        const response = await cr().matchAll('Good Morning', /\b/g);
        expect(response.matches.map((m) => m.index)).toEqual([0, 4, 5, 12]);
    });

    test('workerExec', async () => {
        const response = await cr().exec(/ \b\w+/g, 'Good Morning.');
        expect(response.match?.[0]).toEqual(' Morning');
    });

    test('workerMatch', async () => {
        const response = await cr().match('Good Morning.', /Good/);
        expect(response.match?.[0]).toEqual('Good');
    });

    test('workerMatchAllArray', async () => {
        const response = await cr().matchAllArray('Good Morning', [/\b\w+/g]);
        expect(response.results.flatMap((r) => r.matches.map((m) => m[0]))).toEqual(['Good', 'Morning']);
    });

    test('workerMatchAllAsRangePairs', async () => {
        const response = await cr().matchAllAsRangePairs('Good Morning, sunshine.', /\b\w+/g);
        expect(response.ranges).toEqual([
            [0, 4],
            [5, 12],
            [14, 22],
        ]);
    });
});

describe('timeoutRejection', () => {
    test('TimeoutError', async () => {
        const error = new TimeoutError('Test timeout', 100);
        await expect(timeoutRejection(error)).rejects.toBe(error);
    });

    test('timeoutRejection Error', async () => {
        const error = new Error('Test timeout');
        await expect(timeoutRejection(error)).rejects.toBe(error);
    });

    test('timeoutRejection object', async () => {
        const error = { message: 'Test timeout', elapsedTimeMs: 100 };
        await expect(timeoutRejection(error)).rejects.toBeInstanceOf(TimeoutError);
        await expect(timeoutRejection(error)).rejects.toEqual(expect.objectContaining(error));
    });

    test('timeoutRejection string', async () => {
        const error = 'Test timeout';
        await expect(timeoutRejection(error)).rejects.not.toBeInstanceOf(TimeoutError);
    });
});

describe('large text', { timeout: 10_000 }, () => {
    const testRegExp = [
        /(\bc?spell(?:-?checker)?::?)\s*disable(?!-line|-next)\b(?!-)[\s\S]*?((?:\1\s*enable\b)|$)\/gi,\/^.*\bc?spell(?:-?checker)?::?\s*disable-line\b.*\/gim,\/\bc?spell(?:-?checker)?::?\s*disable-next\b.*\s\s?.*/gi,
        /\bc?spell(?:-?checker)?::?\s*ignoreRegExp.*/gim,
        /(?:https?|ftp):\/\/[^\s"]+/gi,
        /<?\b[\w.\-+]{1,128}@\w{1,63}(\.\w{1,63}){1,4}\b>?/gi,
        /-{5}BEGIN\s+(CERTIFICATE|(?:RSA\s+)?(?:PRIVATE|PUBLIC)\s+KEY)[\w=+\-/=\\\s]+?END\s+\1-{5}/g,
        /ssh-rsa\s+[a-z0-9/+]{28,}={0,3}(?![a-z0-9/+=])/gi,
        /(?<![A-Za-z0-9/+])["']?(?:[A-Za-z0-9/+]{40,})["']?(?:\s^\s*["']?[A-Za-z0-9/+]{40,}["']?)+(?:\s^\s*["']?[A-Za-z0-9/+]+={0,3}["']?)?(?![A-Za-z0-9/+=])/gm,
        /(?<=[^A-Za-z0-9/+_]|^)(?=[A-Za-z]{0,80}[0-9+/])(?=[A-Za-z0-9/+]{0,80}?[A-Z][a-z][A-Z])(?=[A-Za-z0-9/+]{0,80}?(?:[A-Z][0-9][A-Z]|[a-z][0-9][a-z]|[A-Z][0-9][a-z]|[a-z][0-9][A-Z]|[0-9][A-Za-z][0-9]))(?=[A-Za-z0-9/+]{0,80}?(?:[a-z]{3}|[A-Z]{3}))(?:[A-Za-z0-9/+]{40,})=*/gm,
        /\b(?![a-f]+\b)(?:0x)?[0-9a-f]{7,}\b/gi,
        /\[[0-9a-f]{7,}\]/gi,
        /\b0x[0-9a-f_]+\b/gi,
        /#[0-9a-f]{3,8}\b/gi,
        /\bsha\d+-[a-z0-9+/]{25,}={0,3}/gi,
        /(?:\b(?:sha\d+|md5|base64|crypt|bcrypt|scrypt|security-token|assertion)[-,:$=]|#code[/])[-\w/+%.]{25,}={0,3}(?:(['"])\s*\+?\s*\1?[-\w/+%.]+={0,3})*(?![-\w/+=%.])/gi,
        /\bU\+[0-9a-f]{4,5}(?:-[0-9a-f]{4,5})?/gi,
        /\b[0-9a-fx]{8}-[0-9a-fx]{4}-[0-9a-fx]{4}-[0-9a-fx]{4}-[0-9a-fx]{12}\b/gi,
        /(?:#[0-9a-f]{3,8})|(?:0x[0-9a-f]+)|(?:\\u[0-9a-f]{4})|(?:\\x\{[0-9a-f]{4}\})/gi,
        /-{5}BEGIN\s+((?:RSA\s+)?PUBLIC\s+KEY)[\w=+\-/=\\\s]+?END\s+\1-{5}/g,
        /\\(?:[anrvtbf]|[xu][a-f0-9]+)/gi,
        /(?<![A-Za-z0-9/+])(?:[A-Za-z0-9/+]{40,})(?:\s^\s*[A-Za-z0-9/+]{40,})*(?:\s^\s*[A-Za-z0-9/+]+=*)?(?![A-Za-z0-9/+=])/gm,
        /\bhref\s*=\s*".*?"/gi,
        /(\bc?spell(?:-?checker)?::?)\s*disable(?!-line|-next)\b(?!-)[\s\S]*?((?:\1\s*enable\b)|$)/gi,
        /^.*\bc?spell(?:-?checker)?::?\s*disable-line\b.*/gim,
        /\bc?spell(?:-?checker)?::?\s*disable-next\b.*\s\s?.*/gi,
        /<<<['"]?(\w+)['"]?[\s\S]+?^\1;/gm,
        /(?:(['"]).*?(?<![^\\]\\(\\\\)*)\1)|(?:`[\s\S]*?(?<![^\\]\\(\\\\)*)`)/g,
        /(?<!\w:)(?:\/\/.*)|(?:\/\*[\s\S]*?\*\/)/g,
        /.*/gim,
        /\bid="[^"]*"/gi,
        /\bsrc="[^"]*"/gi,
        /\bclass="[^"]*"/gi,
        /\baria-activedescendant="[^"]*"/gi,
        /\baria-controls="[^"]*"/gi,
        /\baria-describedby="[^"]*"/gi,
        /\baria-details="[^"]*"/gi,
        /\baria-errormessage="[^"]*"/gi,
        /\baria-flowto="[^"]*"/gi,
        /\baria-labelledby="[^"]*"/gi,
        /\baria-owns="[^"]*"/gi,
        /\bfor="[^"]*"/gi,
        /&[a-z]+;/gi,
        /^\s*import\s+[\w.]+/gm,
        /(\.\w+)+(?=\()/g,
        /(?<=\])\[[-\w.`'"*&;#@ ]+\]/g,
        /\[[-\w.`'"*&;#@ ]+\]:( [^\s]*)?/g,
        /(?<=\]\()[^)\s]+/g,
        /(?<=<a\s+id=")[^"\s]+/g,
        /0x[a-f0-9]*/gi,
        /\bN'/g,
        /\b0[xX][a-fA-F0-9]+n?\b/g,
        /\\x[a-f0-9]{2}/gi,
        /\\u[a-f0-9]{4}/gi,
        /\/[dgimsuy]{1,7}\b(?=(?:\.flags\b)|\s*$|[;),])/g,
        /&[a-z]+;/g,
        /'s\b/gi,
    ];

    test('pnpm-lock.yaml', async () => {
        const url = new URL('../pnpm-lock.yaml', import.meta.url);
        const text = await fs.readFile(url, 'utf8');
        const regexp = /\w+/dg;
        const expected = [...text.matchAll(regexp)];
        const r = await cr().matchAll(text, regexp);
        expect(r.matches).toEqual(expected);
    });

    test('Array of regexp', async () => {
        const url = new URL('../pnpm-lock.yaml', import.meta.url);
        const text = await fs.readFile(url, 'utf8');
        const expected = testRegExp.map(rd).map((regexp) => [...text.matchAll(regexp)]);
        const r = await cr().matchAllArray(text, testRegExp);
        expect(r.results.map((r) => r.matches)).toEqual(expected);
    });
});

function rd(regexp: RegExp): RegExp {
    return regexp.hasIndices ? regexp : new RegExp(regexp.source, `d${regexp.flags}`);
}

function run(fn: (w: RegExpWorkerBase) => Promise<unknown> | void, w = cr()): () => Promise<void> {
    return async () => {
        try {
            await fn(w);
        } finally {
            catchErrors(w.dispose());
        }
    };
}
