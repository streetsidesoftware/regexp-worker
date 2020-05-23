import { RegExpWorker } from './RegExpWorker';

// cspell:ignore hellothere

describe('RegExpWorker', () => {
    test('execRegExp', () => {
        return run(async w => {
            const r = await w.execRegExp(/\w/g, 'hello\nthere');
            expect(r.matches.map(m => m[0])).toEqual('hellothere'.split(''));
        });
    });
});

function run(fn: (w: RegExpWorker) => Promise<any>, w = new RegExpWorker()) {
    fn(w).finally(w.dispose);
}
