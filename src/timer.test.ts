import { describe, expect, test } from 'vitest';

import { elapsedTimeMsFrom, measureExecution, measurePromise } from './timer.js';

describe('Validate timer', () => {
    test('elapsedTimeMsFrom', () => {
        const start = performance.now();
        const elapsed = elapsedTimeMsFrom(start);
        expect(elapsed).toBeGreaterThan(0);
    });

    test('measureExecution', () => {
        const result = measureExecution(() => {
            // Simulate some work
            for (let i = 0; i < 1000; i++) {
                Math.sqrt(i);
            }
            return 'done';
        });
        expect(result.elapsedTimeMs).toBeGreaterThan(0);
        expect(result.r).toBe('done');
    });

    test('measurePromise', async () => {
        const result = await measurePromise(async () => {
            // Simulate some async work
            return new Promise((resolve) => {
                setTimeout(() => resolve('done'), 100);
            });
        });
        expect(result.elapsedTimeMs).toBeGreaterThan(90); // Allow some margin for the timeout
        expect(result.r).toBe('done');
    });
});
