import { Scheduler, ErrorFailedRequest } from './scheduler';
import { RequestEcho, createRequestEcho } from '../Procedures/procEcho';
import { createRequestSleep } from '../Procedures/procSleep';
import { createRequestSpin } from '../Procedures/procSpin';
import { Response } from '../Procedures/procedure';
import { createRequestGenError } from '../Procedures/procGenError';

describe('Scheduler', () => {
    test('Create', () => {
        const s = new Scheduler();
        return expect(s.dispose()).resolves.toBe(undefined);
    });

    test('Create forget to dispose', () => {
        const s = new Scheduler();
        expect(s).toBeDefined();
    });

    test(
        'Echo',
        run(async (scheduler) => {
            const request = Scheduler.createRequest<RequestEcho>('Echo', sampleText());
            const r = await scheduler.scheduleRequest(request);
            expect(r.data).toBe(sampleText());
        })
    );

    test(
        'Multiple Identical Requests',
        run(async (scheduler) => {
            const request = Scheduler.createRequest<RequestEcho>('Echo', sampleText());
            const r1 = scheduler.scheduleRequest(request);
            const r2 = scheduler.scheduleRequest(request);
            const r3 = scheduler.scheduleRequest(request);
            expect(r2).toBe(r1);
            expect(r3).toBe(r1);
            expect((await r1).data).toBe(sampleText());
        })
    );

    test(
        'Requests are resolved in Time order',
        run(async (scheduler) => {
            const results = await Promise.all([
                scheduler.scheduleRequest(createRequestEcho('One')),
                scheduler.scheduleRequest(createRequestEcho('Two')),
                scheduler.scheduleRequest(createRequestSleep(50), 2).catch((e) => e),
                scheduler.scheduleRequest(createRequestEcho('Three')),
                scheduler.scheduleRequest(createRequestEcho('Four')),
            ]);
            const timestamps = results.map((v) => v.timestamp);
            timestamps.reduce((a, n) => {
                expect(n).toBeGreaterThanOrEqual(a);
                return n;
            }, 0);
        })
    );

    test(
        'Requests with time in between requests.',
        run(async (scheduler) => {
            const requests: Promise<Response>[] = [];
            requests.push(scheduler.scheduleRequest(createRequestEcho('One')));
            await delay(100);
            requests.push(scheduler.scheduleRequest(createRequestEcho('Two')));
            await delay(5);
            requests.push(scheduler.scheduleRequest(createRequestEcho('Three')));
            await delay(10);
            requests.push(scheduler.scheduleRequest(createRequestEcho('Four')));
            await delay(10);

            const results = await Promise.all(requests);
            const timestamps = results.map((v) => v.timestamp);
            timestamps.reduce((a, n) => {
                expect(n).toBeGreaterThanOrEqual(a);
                return n;
            }, 0);
        })
    );

    test(
        'Multiple Requests',
        run(async (scheduler) => {
            const lines = sampleText().split('\n');
            const pResponses = lines
                .map((line, index) => [
                    scheduler.scheduleRequest(createRequestEcho(line)),
                    index % 3 === 1 ? scheduler.scheduleRequest(createRequestSleep(5)) : undefined,
                ])
                .reduce((a, b) => a.concat(b), [])
                .filter(<T>(v: T | undefined): v is T => !!v);
            const responses = await Promise.all(pResponses);
            const responseData = responses.filter((r) => r.responseType === 'Echo').map((r) => r.data);
            expect(responseData).toEqual(lines);
            // Make sure timestamps are ascending
            const timestamps = responses.map((r) => r.timestamp);
            timestamps.reduce((last, next) => {
                expect(next).toBeGreaterThanOrEqual(last);
                return next;
            });
        })
    );

    test(
        'Unknown Request',
        run(async (scheduler) => {
            const request = Scheduler.createRequest('My Unknown Request', 'data');
            const res = scheduler.scheduleRequest(request);
            await expect(res).rejects.toBeInstanceOf(ErrorFailedRequest);
            await expect(res).rejects.toEqual(
                expect.objectContaining({
                    message: 'Unhandled Request',
                    requestType: 'My Unknown Request',
                    data: 'data',
                })
            );
        })
    );

    test('Termination on shutdown', () => {
        const scheduler = new Scheduler();
        return Promise.all([
            expect(scheduler.scheduleRequest(createRequestSpin(5000))).rejects.toEqual(
                expect.objectContaining({ message: expect.stringContaining('stopped') })
            ),
            expect(scheduler.scheduleRequest(createRequestSpin(4000))).rejects.toEqual(
                expect.objectContaining({ message: expect.stringContaining('stopped') })
            ),
            expect(scheduler.scheduleRequest(createRequestSpin(2000))).rejects.toEqual(
                expect.objectContaining({ message: expect.stringContaining('stopped') })
            ),
            expect(delay(1).then(() => scheduler.dispose())).resolves.toBeUndefined(),
            expect(delay(5).then(() => scheduler.scheduleRequest(createRequestEcho('Too Late')))).rejects.toEqual(
                expect.objectContaining({ message: expect.stringContaining('stopped') })
            ),
            expect(delay(2).then(() => scheduler.dispose())).resolves.toBeUndefined(),
            expect(delay(3).then(() => scheduler.dispose())).resolves.toBeUndefined(),
        ]);
    });

    test(
        'Termination of single request',
        run((scheduler) => {
            const junkRequest: any = {};
            const spinRequest = createRequestSpin(5000);
            return Promise.all([
                expect(
                    scheduler.scheduleRequest(spinRequest).then(
                        () => false,
                        () => true
                    )
                ).resolves.toBeTrue(),
                expect(scheduler.scheduleRequest(spinRequest)).rejects.toEqual(
                    expect.objectContaining({ message: expect.stringContaining('Request Terminated') })
                ),
                expect(scheduler.scheduleRequest(createRequestEcho('One'))).resolves.toEqual(expect.objectContaining({ data: 'One' })),
                expect(scheduler.scheduleRequest(createRequestEcho('Two'))).resolves.toEqual(expect.objectContaining({ data: 'Two' })),
                expect(scheduler.scheduleRequest(junkRequest)).rejects.toEqual(expect.objectContaining({ message: 'Bad Request' })),
                expect(scheduler.terminateRequest('Bad ID')).rejects.toEqual(expect.objectContaining({ message: 'Unknown Request' })),
                expect(delay(1).then(() => scheduler.terminateRequest(spinRequest.id))),
            ]);
        })
    );

    test(
        'Timeout Request',
        run((scheduler) => {
            const spinRequest = createRequestSpin(500);
            return Promise.all([
                expect(scheduler.scheduleRequest(createRequestEcho('One'))).resolves.toEqual(expect.objectContaining({ data: 'One' })),
                expect(scheduler.scheduleRequest(createRequestEcho('Two'))).resolves.toEqual(expect.objectContaining({ data: 'Two' })),
                expect(scheduler.scheduleRequest(spinRequest, 5)).rejects.toEqual(
                    expect.objectContaining({ message: expect.stringContaining('Request Timeout') })
                ),
                expect(scheduler.scheduleRequest(createRequestEcho('Three'))).resolves.toEqual(expect.objectContaining({ data: 'Three' })),
            ]);
        })
    );

    test(
        'Errors',
        run(async (scheduler) => {
            const errorThrow = await scheduler.scheduleRequest(createRequestGenError('Throw')).catch((e) => e);
            expect(errorThrow).toEqual(
                expect.objectContaining({
                    message: 'Error Thrown',
                    data: 'Throw',
                })
            );
            await expect(scheduler.scheduleRequest(createRequestGenError('reject'))).rejects.toEqual(
                expect.objectContaining({ message: 'Error: Reject' })
            );
        })
    );
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
    };
}

function delay(delayMs: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, delayMs);
    });
}
