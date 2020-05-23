import { isRequest } from './procedure';
import { createId } from './uniqueId';


describe('procedures', () => {
    it('isA', () => {
        expect(isRequest({})).toBe(false);
        expect(isRequest({ id: createId(), requestType: 'Echo'})).toBe(true);
        expect(isRequest({ id: createId(), requestType: 'Other'})).toBe(true);
        expect(isRequest({ id: '5', requestType: 'Other'})).toBe(false);
        expect(isRequest({ id: createId(), requestType: undefined})).toBe(false);
    });
});
