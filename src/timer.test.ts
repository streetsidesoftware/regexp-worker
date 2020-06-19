import { hrTimeToMs } from './timer'

describe('Validate timer', () => {
    test('hrTimeToMs', () => {
        expect(hrTimeToMs([0,0])).toBe(0);
        expect(hrTimeToMs([1,0])).toBe(1000);
        expect(hrTimeToMs([1,250000000])).toBe(1250);
    });
});
