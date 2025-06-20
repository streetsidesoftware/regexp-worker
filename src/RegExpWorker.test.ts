/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, test, expect } from 'vitest';
import { RegExpWorker, execRegExpOnWorker, execRegExpMatrixOnWorker, timeoutRejection } from './RegExpWorker.js';
import { TimeoutError } from './TimeoutError.js';
import { catchErrors } from './helpers/errors.js';

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
    test(
        'execRegExp',
        run(async (w) => {
            const r = await w.execRegExp(/\w/g, 'hello\nthere');
            expect(r.matches.map((m) => m[0])).toEqual('hellothere'.split(''));
            expect(r.elapsedTimeMs).toBeGreaterThan(0);
        }),
    );

    test(
        'execRegExpMatrix',
        run(async (w) => {
            const r = await w.execRegExpMatrix([/\w/g], ['hello\nthere']);
            expect(r.matrix[0].results[0].matches.map((m) => m[0])).toEqual('hellothere'.split(''));
            expect(r.elapsedTimeMs).toBeGreaterThan(0);
        }),
    );

    test(
        'matchRegExp',
        run(async (w) => {
            const text = 'hello\nthere';
            const r = await w.matchRegExp(text, /\w/g);
            expect([...r.ranges].map((m) => text.slice(...m))).toEqual('hellothere'.split(''));
            expect(r.elapsedTimeMs).toBeGreaterThan(0);
        }),
    );

    test(
        'matchRegExpArray',
        run(async (w) => {
            const text = 'hello\nthere';
            const r = await w.matchRegExpArray(text, [/\w/g]);
            expect([...r.results[0].ranges].map((m) => text.slice(...m))).toEqual('hellothere'.split(''));
            expect(r.elapsedTimeMs).toBeGreaterThan(0);
            expect(r.results[0].elapsedTimeMs).toBeGreaterThan(0);
            expect(r.elapsedTimeMs).toBeGreaterThanOrEqual(r.results[0].elapsedTimeMs);
        }),
    );

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
            const r = worker.execRegExp(/(x+x+)+y/, 'x'.repeat(30), 5);
            return expect(r).rejects.toEqual(
                expect.objectContaining({ elapsedTimeMs: expect.toBeWithin(3, 50), message: expect.stringContaining('Request Timeout') }),
            );
        }),
    );

    test('execRegExpOnWorker', async () => {
        const response = await execRegExpOnWorker(/\b\w+/g, 'Good Morning');
        expect(response.matches.map((m) => m[0])).toEqual(['Good', 'Morning']);
    });

    test('execRegExpOnWorker on word boundaries', async () => {
        const response = await execRegExpOnWorker(/\b/g, 'Good Morning');
        expect(response.matches.map((m) => m.index)).toEqual([0, 4, 5, 12]);
    });

    test('execRegExpMatrixOnWorker', async () => {
        const response = await execRegExpMatrixOnWorker([/\b\w+/g], ['Good Morning']);
        expect(response.matrix[0].results[0].matches.map((m) => m[0])).toEqual(['Good', 'Morning']);
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

function run(fn: (w: RegExpWorker) => Promise<unknown> | void, w = new RegExpWorker()): () => Promise<void> {
    return async () => {
        try {
            await fn(w);
        } finally {
            catchErrors(w.dispose());
        }
    };
}
