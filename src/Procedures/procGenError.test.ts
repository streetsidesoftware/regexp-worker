import { describe, test, expect } from 'vitest';
import {
    createRequestGenError,
    // createResponseGenError,
    isGenErrorRequest,
    // isGenErrorResponse,
    procGenError,
} from './procGenError.js';
import { createId } from './uniqueId.js';

describe('GenError', () => {
    test('isA', () => {
        expect(isGenErrorRequest({})).toBe(false);
        expect(isGenErrorRequest({ id: createId(), requestType: 'GenError' })).toBe(true);
        expect(isGenErrorRequest(createRequestGenError('Throw'))).toBe(true);
    });

    test('text errors', async () => {
        expect(() => procGenError(createRequestGenError('Throw'))).toThrowError('Error Thrown');
        await expect(procGenError(createRequestGenError('undefined'))).resolves.toBeUndefined();
    });
});
