import { describe, test, expect } from 'vitest';

import { TimeoutError, isTimeoutErrorLike } from './TimeoutError.js';

describe('TimeoutError', () => {
    test('should create a TimeoutError with a message', () => {
        const error = new TimeoutError('Operation timed out', 0);
        expect(error).toBeInstanceOf(TimeoutError);
        expect(error.message).toBe('Operation timed out');
    });

    test.each`
        value                                         | expected
        ${undefined}                                  | ${false}
        ${new TimeoutError('Operation timed out', 0)} | ${true}
        ${{ message: 'msg', elapsedTimeMs: 4 }}       | ${true}
    `('isTimeoutErrorLike $value', ({ value, expected }) => {
        expect(isTimeoutErrorLike(value)).toBe(expected);
    });
});
