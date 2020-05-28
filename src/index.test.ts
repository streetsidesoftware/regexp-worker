import {} from '.';
import { RegExpWorker } from './RegExpWorker';

describe('Validate Index', () => {
    test('quick test RegExpWorker', run(async (w) => {
        const r = await w.execRegExp(/./g, 'hello');
        expect(r.elapsedTimeMs).toBeGreaterThan(0);
        expect(r.elapsedTimeMs).toBeLessThan(10);
        expect(r.matches.map(m => m[0])).toEqual('hello'.split(''));
    }));
});

function run(fn: (w: RegExpWorker) => Promise<any>, w = new RegExpWorker()): () => Promise<void> {
    return () => fn(w).finally(w.dispose).then();
}
