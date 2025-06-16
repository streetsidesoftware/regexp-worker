import { describe, test, expect } from 'vitest';
import { createId, isId, NullID } from './uniqueId.js';

describe('unique id', () => {
    test('createId', () => {
        const id1 = createId();
        const id2 = createId();
        expect(id1).not.toBe(id2);
        expect(isId(id1)).toBe(true);
        expect(isId(id2)).toBe(true);
        expect(isId(id1.slice(0, -1) + '9')).toBe(false);
    });

    test('nullID', () => {
        expect(isId(NullID)).toBe(true);
    });
});
