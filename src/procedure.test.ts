import { isRequest } from './procedure';


describe('procedures', () => {
    it('isA', () => {
        expect(isRequest({})).toBe(false);
        expect(isRequest({ id: 1, requestType: 'Echo'})).toBe(true);
        expect(isRequest({ id: 5, requestType: 'Other'})).toBe(true);
        expect(isRequest({ id: '5', requestType: 'Other'})).toBe(false);
        expect(isRequest({ id: 5, requestType: undefined})).toBe(false);
    });
});
