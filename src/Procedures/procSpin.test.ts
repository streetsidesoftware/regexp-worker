/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, expect, test } from 'vitest';

import { measurePromise } from '../timer.js';
import type { RequestSpin } from './procSpin.js';
import { createRequestSpin, isSpinRequest, procSpin } from './procSpin.js';
import { createId } from './uniqueId.js';

describe('Spin', () => {
    test('isA', () => {
        expect(isSpinRequest({})).toBe(false);
        expect(isSpinRequest({ id: createId(), requestType: 'Spin' })).toBe(true);
    });

    test('Spin for 5ms', async () => {
        const req = createRequestSpin({ durationMs: 5 });
        const m = await measurePromise(() => procSpin(req));
        const r = m.r;
        expect(r.id).toBe(req.id);
        expect(r.responseType).toBe('Spin');
        expect(r.data).toEqual(
            expect.objectContaining({
                count: expect.any(Number),
                elapsedTimeMs: expect.any(Number),
            }),
        );
        expect(m.elapsedTimeMs).toBeGreaterThan(req.data.durationMs);
    });

    test('Bad Request', async () => {
        const req = { id: createId(), requestType: 'Spin', data: {} };
        const r = await procSpin(req as RequestSpin);
        expect(r.responseType).toBe('Error');
    });
});
