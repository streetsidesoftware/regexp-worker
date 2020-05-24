import { isSleepRequest, procSleep, createRequestSleep,  } from './procSleep';
import { createId } from './uniqueId';
import { measurePromise } from '../timer';


describe('Sleep', () => {
    test('isA', () => {
        expect(isSleepRequest({})).toBe(false);
        expect(isSleepRequest({ id: createId(), requestType: 'Sleep' })).toBe(true);
    });

    test('echo', async () => {
        const req = createRequestSleep({ durationMs: 2 });
        const m = await measurePromise(() => procSleep(req));
        const r = m.r;
        expect(r.id).toBe(req.id);
        expect(r.responseType).toBe('Sleep');
        expect(r.data).toEqual(req.data);
        expect(m.elapsedTimeMs).toBeGreaterThan(req.data.durationMs);
    });
});
