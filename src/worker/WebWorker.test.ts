import { describe, expect, test } from 'vitest';

import { supportsWebWorkers } from './WebWorker.js';

describe('WebWorker', () => {
    test('supportsWebWorkers', () => {
        expect(supportsWebWorkers()).toBeTypeOf('boolean');
        expect(supportsWebWorkers()).toBe(false);
    });
});
