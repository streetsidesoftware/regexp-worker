import {} from '.';
import { RegExpWorker } from './RegExpWorker';

describe('Validate Index', () => {
    test('quick test RegExpWorker', async () => {
        const w = new RegExpWorker();
        const r = await w.execRegExp(/./g, 'hello');
        expect(r.elapsedTimeMs).toBeGreaterThan(0);
        expect(r.elapsedTimeMs).toBeLessThan(10);
        expect(r.matches.map(m => m[0])).toEqual('hello'.split(''));
        await w.dispose();
    });
});
