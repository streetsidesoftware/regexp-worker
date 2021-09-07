import { isSleepRequest, procSleep, createRequestSleep } from './procSleep';
import { createId } from './uniqueId';
import { measurePromise } from '../timer';

describe('Sleep', () => {
    test('isA', () => {
        expect(isSleepRequest({})).toBe(false);
        expect(isSleepRequest({ id: createId(), requestType: 'Sleep' })).toBe(true);
    });

    test('Sleep for 5ms', async () => {
        const req = createRequestSleep({ durationMs: 5 });
        const m = await measurePromise(() => procSleep(req));
        const r = m.r;
        expect(r.id).toBe(req.id);
        expect(r.responseType).toBe('Sleep');
        expect(r.data).toEqual(req.data);
        // Note Node.js timers are not accurate, so it is possible it can finish faster than expected.
        expect(m.elapsedTimeMs).toBeGreaterThan(req.data.durationMs - 2);
    });

    test('Sleep for -5ms', async () => {
        const req: any = { id: createId(), requestType: 'Sleep' };
        const m = await measurePromise(() => procSleep(req));
        const r = m.r;
        expect(r.id).toBe(req.id);
        expect(r.responseType).toBe('Error');
    });
});
