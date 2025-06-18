/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, test, expect } from 'vitest';
import { isSpinRequest, procSpin, createRequestSpin } from './procSpin.js';
import { createId } from './uniqueId.js';
import { measurePromise } from '../timer.js';

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
        const req: any = { id: createId(), requestType: 'Spin', data: {} };
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const r = await procSpin(req);
        expect(r.responseType).toBe('Error');
    });
});
