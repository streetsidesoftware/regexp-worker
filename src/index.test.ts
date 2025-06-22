import { describe, expect, test } from 'vitest';

import { catchErrors } from './helpers/errors.js';
import { RegExpWorker } from './index.mjs';

describe('Validate Index', () => {
    test(
        'quick test RegExpWorker',
        run(async (w) => {
            const r = await w.matchAll('hello', /./g, 500);
            expect(r.elapsedTimeMs).toBeGreaterThan(0);
            expect(r.elapsedTimeMs).toBeLessThan(10);
            expect(r.matches.map((m) => m[0])).toEqual('hello'.split(''));
        }),
    );

    test('Auto cleanup after delay', async () => {
        const w = new RegExpWorker();
        const r = await w.matchAll('hello', /./g, 500);
        expect(r.elapsedTimeMs).toBeGreaterThan(0);
        expect(r.elapsedTimeMs).toBeLessThan(10);
        expect(r.matches.map((m) => m[0])).toEqual('hello'.split(''));
        await delay(500);
    });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function run(fn: (w: RegExpWorker) => Promise<any>, w = new RegExpWorker()): () => Promise<void> {
    return () => fn(w).finally(() => catchErrors(w.dispose()));
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
