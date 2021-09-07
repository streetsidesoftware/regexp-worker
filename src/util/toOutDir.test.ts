import { toOutDir } from './toOutDir';
import * as Path from 'path';

describe('toOutDir', () => {
    it('toOutDir', () => {
        const r = toOutDir(__filename);
        const isTS = /\.ts$/.test(__filename);
        if (isTS) {
            expect(r).not.toBe(__filename);
        } else {
            expect(r).toBe(__filename);
        }
        expect(Path.basename(r)).toBe(Path.basename(__filename));
    });
});
