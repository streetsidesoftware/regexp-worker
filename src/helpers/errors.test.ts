import { describe, test, expect } from 'vitest';
import { isError, __testing__ } from './errors.js';

class MyError extends Error {
    constructor(msg: string) {
        super(msg);
    }
}

describe('errors', () => {
    test.each`
        value                                   | expected
        ${null}                                 | ${false}
        ${'hello'}                              | ${false}
        ${undefined}                            | ${false}
        ${{}}                                   | ${false}
        ${{ message: '', name: '' }}            | ${true}
        ${{ message: '', name: '', stack: '' }} | ${true}
        ${{ message: '', name: '', stack: 5 }}  | ${false}
        ${new Error('test error')}              | ${true}
        ${new MyError('test error')}            | ${true}
    `('isError $value', ({ value, expected }) => {
        expect(isError(value)).toBe(expected);
    });

    test('_getTypeOf', () => {
        expect(__testing__._getTypeOf('')).toBe('string');
    });
});
