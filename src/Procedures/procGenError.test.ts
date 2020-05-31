import {
    createRequestGenError,
    // createResponseGenError,
    isGenErrorRequest,
    // isGenErrorResponse,
    procGenError,
} from './procGenError';
import { createId } from './uniqueId';


describe('GenError', () => {
    test('isA', () => {
        expect(isGenErrorRequest({})).toBe(false);
        expect(isGenErrorRequest({ id: createId(), requestType: 'GenError' })).toBe(true);
        expect(isGenErrorRequest(createRequestGenError('Throw'))).toBe(true)
    });

    test('text errors', async () => {
        expect(() => procGenError(createRequestGenError('Throw'))).toThrowError('Error Thrown')
        expect(procGenError(createRequestGenError('undefined'))).resolves.toBeUndefined()
    });
});
