import { isError, __testing__ } from './errors';

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
    `('isError', ({ value, expected }) => {
        expect(isError(value)).toBe(expected);
    });

    test('_getTypeOf', () => {
        expect(__testing__._getTypeOf('')).toBe('string');
    });
});
