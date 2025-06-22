import * as Path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

import { toOutDir } from './toOutDir.js';

const __filename = fileURLToPath(import.meta.url);

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
