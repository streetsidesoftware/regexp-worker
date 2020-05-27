import { RegExpWorker } from './RegExpWorker';
import 'jest-extended';

// cspell:ignore hellothere

describe('RegExpWorker', () => {
    test(
        'execRegExp',
        run(async (w) => {
            const r = await w.execRegExp(/\w/g, 'hello\nthere');
            expect(r.matches.map((m) => m[0])).toEqual('hellothere'.split(''));
            expect(r.elapsedTimeMs).toBeLessThan(2);
        })
    );

    test(
        'execRegExpMatrix',
        run(async (w) => {
            const r = await w.execRegExpMatrix([/\w/g], ['hello\nthere']);
            expect(r.matrix[0].results[0].matches.map((m) => m[0])).toEqual('hellothere'.split(''));
            expect(r.elapsedTimeMs).toBeLessThan(2);
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
            const r = worker.execRegExp(/(x+x+)+y/, 'x'.repeat(50), 5);
            return expect(r).rejects.toEqual(expect.objectContaining({
                'elapsedTimeMs': expect.toBeWithin(3, 50),
                'message': expect.stringContaining('Request Timeout'),
            }));
        })
    );
});

function run(fn: (w: RegExpWorker) => Promise<any>, w = new RegExpWorker()): () => Promise<void> {
    return () => fn(w).finally(w.dispose).then();
}
