import { Scheduler, ErrorFailedRequest } from './scheduler';
import { RequestEcho, createRequestEcho } from '../Procedures/procEcho';
import { createRequestSleep } from '../Procedures/procSleep';

describe('Scheduler', () => {

    test('Create', () => {
        const m = new Scheduler();
        return expect(m.dispose()).resolves.toBe(0);
    });

    test('Echo', run(async scheduler => {
        const request = scheduler.createRequest<RequestEcho>('Echo', sampleText());
        const r = await scheduler.sendRequest(request);
        expect(r.data).toBe(sampleText());
    }));

    test('Multiple Identical Requests', run(async scheduler => {
        const request = scheduler.createRequest<RequestEcho>('Echo', sampleText());
        const r1 = scheduler.sendRequest(request);
        const r2 = scheduler.sendRequest(request);
        const r3 = scheduler.sendRequest(request);
        expect(r2).toBe(r1);
        expect(r3).toBe(r1);
        expect((await r1).data).toBe(sampleText());
    }));

    test('Multiple Requests', run(async scheduler => {
        const lines = sampleText().split('\n');
        const pResponses = lines.map((line, index) => [
            scheduler.sendRequest(createRequestEcho(line)),
            index % 3 === 1 ? scheduler.sendRequest(createRequestSleep(5)) : undefined,
        ]).reduce((a, b) => a.concat(b), []).filter(<T>(v: T | undefined): v is T => !!v);
        const responses = await Promise.all(pResponses);
        const responseData = responses.filter(r => r.responseType === 'Echo').map(r => r.data);
        expect(responseData).toEqual(lines);
        // Make sure timestamps are ascending
        const timestamps = responses.map(r => r.timestamp);
        timestamps.reduce((last, next) => {
            expect(next).toBeGreaterThanOrEqual(last)
            return next
        })
    }));

    test('Unknown Request', run(async scheduler => {
        const request = scheduler.createRequest('My Unknown Request', 'data');
        const res = scheduler.sendRequest(request);
        await expect(res).rejects.toBeInstanceOf(ErrorFailedRequest);
        await expect(res).rejects.toEqual(expect.objectContaining({
            message: 'Unhandled Request',
            requestType: 'My Unknown Request',
            data: 'data',
        }));
    }));
});

function sampleText() {
    return `
    test('EvaluateRegExp', () => {
        const manager = new Manager(libDir);
        async function run() {
            const r = await manager.evaluateRegExp(/\w+/g, );
            expect(r).toBe('hello there');
        }

        return run().finally(manager.dispose);
    });
`;
}

/**
 * This function is needed to make sure we always dispose of the scheduler
 * @param fn function to wrap
 */
function run<T>(fn: (scheduler: Scheduler) => Promise<T> | T): () => Promise<T> {
    return () => {
        const s = new Scheduler();
        return new Promise<T>(resolve => resolve(fn(s))).finally(s.dispose);
    }
}
