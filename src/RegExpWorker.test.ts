import { RegExpWorker, execRegExpOnWorker, execRegExpMatrixOnWorker } from './RegExpWorker';
import 'jest-extended';

// cspell:ignore hellothere

describe('RegExpWorker', () => {
    test(
        'execRegExp',
        run(async (w) => {
            const r = await w.execRegExp(/\w/g, 'hello\nthere');
            expect(r.matches.map((m) => m[0])).toEqual('hellothere'.split(''));
            expect(r.elapsedTimeMs).toBeGreaterThan(0);
        })
    );

    test(
        'execRegExpMatrix',
        run(async (w) => {
            const r = await w.execRegExpMatrix([/\w/g], ['hello\nthere']);
            expect(r.matrix[0].results[0].matches.map((m) => m[0])).toEqual('hellothere'.split(''));
            expect(r.elapsedTimeMs).toBeGreaterThan(0);
        })
    );

    test(
        'matchRegExp',
        run(async (w) => {
            const text = 'hello\nthere';
            const r = await w.matchRegExp(text, /\w/g);
            expect([...r.ranges].map((m) => text.slice(...m))).toEqual('hellothere'.split(''));
            expect(r.elapsedTimeMs).toBeGreaterThan(0);
        })
    );

    test(
        'matchRegExpArray',
        run(async (w) => {
            const text = 'hello\nthere';
            const r = await w.matchRegExpArray(text, [/\w/g]);
            expect([...r.results[0].ranges].map((m) => text.slice(...m))).toEqual('hellothere'.split(''));
            expect(r.elapsedTimeMs).toBeGreaterThan(0);
            expect(r.results[0].elapsedTimeMs).toBeGreaterThan(0);
            expect(r.elapsedTimeMs).toBeGreaterThanOrEqual(r.results[0].elapsedTimeMs);
        })
    );

    test(
        'set timeout',
        run(async (worker) => {
            expect(worker.timeout).toBeGreaterThan(0);
            worker.timeout = 5.2;
            expect(worker.timeout).toBe(5.2);
            worker.timeout = 0;
            expect(worker.timeout).toBe(0);
        })
    );

    test(
        'very slow regexp',
        run((worker) => {
            const r = worker.execRegExp(/(x+x+)+y/, 'x'.repeat(30), 5);
            return expect(r).rejects.toEqual(
                expect.objectContaining({
                    elapsedTimeMs: expect.toBeWithin(3, 50),
                    message: expect.stringContaining('Request Timeout'),
                })
            );
        })
    );

    test('execRegExpOnWorker', async () => {
        const response = await execRegExpOnWorker(/\b\w+/g, 'Good Morning');
        expect(response.matches.map((m) => m[0])).toEqual(['Good', 'Morning']);
    });

    test('execRegExpOnWorker on word boundaries', async () => {
        const response = await execRegExpOnWorker(/\b/g, 'Good Morning');
        expect(response.matches.map((m) => m.index)).toEqual([0, 4, 5, 12]);
    });

    test('execRegExpMatrixOnWorker', async () => {
        const response = await execRegExpMatrixOnWorker([/\b\w+/g], ['Good Morning']);
        expect(response.matrix[0].results[0].matches.map((m) => m[0])).toEqual(['Good', 'Morning']);
    });
});

function run(fn: (w: RegExpWorker) => Promise<any>, w = new RegExpWorker()): () => Promise<void> {
    return () => fn(w).finally(w.dispose).then();
}
