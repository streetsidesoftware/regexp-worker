import { describe, test, expect, vi } from 'vitest';
import { isErrorLike, __testing__, toError, catchErrors } from './errors.js';

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
        expect(isErrorLike(value)).toBe(expected);
    });

    test('toError', () => {
        expect(toError(null)).toEqual(new Error('null'));
        expect(toError('hello')).toEqual(new Error('hello'));
        expect(toError({ name: 'error', message: 'hello' })).toEqual(new Error('hello'));
        expect(toError({ name: 'error', message: '' })).toEqual(new Error('Unknown error'));
    });

    test('catchErrors', async () => {
        const err = new Error('error');
        const p = Promise.reject(err);
        expect(catchErrors(Promise.resolve())).toBeUndefined();
        expect(catchErrors(p)).toBeUndefined();
        expect(
            catchErrors(p, (err) => {
                throw err;
            }),
        ).toBeUndefined();
        const fn = vi.fn();
        expect(catchErrors(p, fn)).toBeUndefined();
        await p.catch(() => {});
        expect(fn).toHaveBeenCalledWith(err);
    });

    test('_getTypeOf', () => {
        expect(__testing__._getTypeOf('')).toBe('string');
    });
});
