import { Scheduler, ErrorFailedRequest } from './scheduler';
import { RequestEcho, createRequestEcho } from '../Procedures/procEcho';
import { createRequestSleep } from '../Procedures/procSleep';
import { createRequestSpin } from '../Procedures/procSpin';

describe('Scheduler', () => {

    test('Create', () => {
        const m = new Scheduler();
        return expect(m.dispose()).resolves.toBe(0);
    });

    test('Echo', run(async scheduler => {
        const request = Scheduler.createRequest<RequestEcho>('Echo', sampleText());
        const r = await scheduler.scheduleRequest(request);
        expect(r.data).toBe(sampleText());
    }));

    test('Multiple Identical Requests', run(async scheduler => {
        const request = Scheduler.createRequest<RequestEcho>('Echo', sampleText());
        const r1 = scheduler.scheduleRequest(request);
        const r2 = scheduler.scheduleRequest(request);
        const r3 = scheduler.scheduleRequest(request);
        expect(r2).toBe(r1);
        expect(r3).toBe(r1);
        expect((await r1).data).toBe(sampleText());
    }));

    test('Multiple Requests', run(async scheduler => {
        const lines = sampleText().split('\n');
        const pResponses = lines.map((line, index) => [
            scheduler.scheduleRequest(createRequestEcho(line)),
            index % 3 === 1 ? scheduler.scheduleRequest(createRequestSleep(5)) : undefined,
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
        const request = Scheduler.createRequest('My Unknown Request', 'data');
        const res = scheduler.scheduleRequest(request);
        await expect(res).rejects.toBeInstanceOf(ErrorFailedRequest);
        await expect(res).rejects.toEqual(expect.objectContaining({
            message: 'Unhandled Request',
            requestType: 'My Unknown Request',
            data: 'data',
        }));
    }));

    test('Termination on shutdown', () => {
        const scheduler = new Scheduler();
        return Promise.all([
            expect(scheduler.scheduleRequest(createRequestSpin(5000))).rejects.toEqual(expect.objectContaining({ message: expect.stringContaining('stopped')})),
            expect(scheduler.scheduleRequest(createRequestSpin(4000))).rejects.toEqual(expect.objectContaining({ message: expect.stringContaining('stopped')})),
            expect(scheduler.scheduleRequest(createRequestSpin(2000))).rejects.toEqual(expect.objectContaining({ message: expect.stringContaining('stopped')})),
            expect(delay(1).then(() => scheduler.dispose())).resolves.toEqual(expect.any(Number)),
        ]);
    });


    test('Termination of single request', run(scheduler => {
        const spinRequest = createRequestSpin(5000);
        return Promise.all([
            expect(scheduler.scheduleRequest(spinRequest)).rejects.toEqual(expect.objectContaining({ message: expect.stringContaining('Request Terminated')})),
            expect(scheduler.scheduleRequest(createRequestEcho('One'))).resolves.toEqual(expect.objectContaining({ data: 'One' })),
            expect(scheduler.scheduleRequest(createRequestEcho('Two'))).resolves.toEqual(expect.objectContaining({ data: 'Two' })),
            expect(delay(1).then(() => scheduler.terminateRequest(spinRequest.id)))
        ]);
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
function run<T>(fn: (scheduler: Scheduler) => Promise<T>): () => Promise<T> {
    return () => {
        const s = new Scheduler();
        return fn(s).finally(s.dispose);
    }
}

function delay(delayMs: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, delayMs);
    });
}
