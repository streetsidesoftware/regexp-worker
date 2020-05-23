import { createId, isId } from './uniqueId';

describe('unique id', () => {
    it('createId', () => {
        const id1 = createId();
        const id2 = createId();
        expect(id1).not.toBe(id2);
        expect(isId(id1)).toBe(true);
        expect(isId(id2)).toBe(true);
        expect(isId(id1.slice(0, -1) + '9')).toBe(false);
    });
});
