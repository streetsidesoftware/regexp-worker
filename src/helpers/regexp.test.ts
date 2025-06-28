/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { describe, expect, test } from 'vitest';

import { isRegExp, isRegExpLike, toRegExp } from './regexp.js';

describe('EvaluateRegExp', () => {
    test.each`
        regExp                                                                   | expected      | expectedLastIndex
        ${/./g}                                                                  | ${/./g}       | ${0}
        ${/./gu}                                                                 | ${/./gu}      | ${0}
        ${'/hello/'}                                                             | ${/hello/}    | ${0}
        ${'hello'}                                                               | ${/hello/}    | ${0}
        ${'hello.'}                                                              | ${/hello./}   | ${0}
        ${'hello*'}                                                              | ${/hello*/}   | ${0}
        ${{ source: 'hello*', flags: 'gu' }}                                     | ${/hello*/gu} | ${0}
        ${{ source: 'hello*', flags: 'gu', lastIndex: 10 }}                      | ${/hello*/gu} | ${10}
        ${{ source: 'hello*', flags: 'gux', lastIndex: 10 }}                     | ${/hello*/gu} | ${10}
        ${{ source: 'hello*', flags: '' }}                                       | ${/hello*/}   | ${0}
        ${{ source: '\nh.* # Match anything starting with `h`\n', flags: 'gx' }} | ${/h.*/g}     | ${0}
        ${{ source: '\nh.* # Use last index 10\n', flags: 'gx', lastIndex: 10 }} | ${/h.*/g}     | ${10}
    `('toRegExp $regExp', ({ regExp, expected, expectedLastIndex }) => {
        const reg = toRegExp(regExp);
        expect(reg).toEqual(expected);
        expect(reg.lastIndex).toBe(expectedLastIndex);
    });

    test.each`
        regExp                                              | expected | expectedIsRegEx
        ${/./g}                                             | ${true}  | ${true}
        ${/./gu}                                            | ${true}  | ${true}
        ${'hello'}                                          | ${false} | ${false}
        ${'hello.'}                                         | ${false} | ${false}
        ${'hello*'}                                         | ${false} | ${false}
        ${{ source: 'hello*', flags: 'gu' }}                | ${true}  | ${false}
        ${{ source: 'hello*', flags: 'gu', lastIndex: 10 }} | ${true}  | ${false}
    `('isRegExLike $regExp', ({ regExp, expected, expectedIsRegEx }) => {
        expect(isRegExpLike(regExp)).toBe(expected);
        expect(isRegExp(regExp)).toBe(expectedIsRegEx);
    });

    test.each`
        regExp                                               | expected
        ${{ source: undefined, flags: 'gu', lastIndex: 10 }} | ${TypeError('Invalid RegExp or string.')}
        ${{ source: '', flags: 4, lastIndex: 10 }}           | ${TypeError('Invalid RegExp or string.')}
        ${null}                                              | ${TypeError('Invalid RegExp or string.')}
        ${'(.'}                                              | ${SyntaxError('Invalid regular expression: /(./: Unterminated group')}
    `('toRegExp Error $regExp', ({ regExp, expected }) => {
        expect(() => toRegExp(regExp)).toThrowError(expected);
    });
});
