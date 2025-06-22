/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, expect, test } from 'vitest';

import { catchErrors } from './helpers/errors.js';
import { RegExpWorker, timeoutRejection, workerExec, workerMatch, workerMatchAll, workerMatchAllArray } from './RegExpWorkerNode.js';
import { TimeoutError } from './TimeoutError.js';

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
        'matchAll',
        run(async (w) => {
            const r = await w.matchAll('hello\nthere', /\w/g);
            expect(r.matches.map((m) => m[0])).toEqual('hellothere'.split(''));
            expect(r.elapsedTimeMs).toBeGreaterThan(0);
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
            const r = worker.matchAll('x'.repeat(30), /(x+x+)+y/, 5);
            return expect(r).rejects.toEqual(
                expect.objectContaining({ elapsedTimeMs: expect.toBeWithin(3, 50), message: expect.stringContaining('Request Timeout') }),
            );
        }),
    );

    test('workerMatchAll', async () => {
        const response = await workerMatchAll('Good Morning', /\b\w+/g);
        expect(response.matches.map((m) => m[0])).toEqual(['Good', 'Morning']);
    });

    test('workerMatchAll on word boundaries', async () => {
        const response = await workerMatchAll('Good Morning', /\b/g);
        expect(response.matches.map((m) => m.index)).toEqual([0, 4, 5, 12]);
    });

    test('workerExec', async () => {
        const response = await workerExec(/ \b\w+/g, 'Good Morning.');
        expect(response.match?.[0]).toEqual(' Morning');
    });

    test('workerMatch', async () => {
        const response = await workerMatch('Good Morning.', /Good/);
        expect(response.match?.[0]).toEqual('Good');
    });

    test('workerMatchAllArray', async () => {
        const response = await workerMatchAllArray('Good Morning', [/\b\w+/g]);
        expect(response.results.flatMap((r) => r.matches.map((m) => m[0]))).toEqual(['Good', 'Morning']);
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
