import { Scheduler, ErrorFailedRequest } from './scheduler';
import { RequestEcho } from '../Procedures/procEcho';

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
