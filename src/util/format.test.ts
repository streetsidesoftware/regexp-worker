import { describe, expect, test } from 'vitest';

import { format } from './format.js';

describe('format', () => {
    const testObj: Record<string, unknown> = {
        toString: 'toString value',
        a: { a: 1, b: 2 },
        r: /.*/g,
    };
    testObj['circular'] = testObj;

    test.each`
        value                            | expected
        ${'hello'}                       | ${'"hello"'}
        ${'hello\t'}                     | ${'"hello\\t"'}
        ${24}                            | ${'24'}
        ${24n}                           | ${'24n'}
        ${Symbol('hello')}               | ${'Symbol(hello)'}
        ${null}                          | ${'null'}
        ${undefined}                     | ${'undefined'}
        ${toString}                      | ${'[Function: toString]'}
        ${fn}                            | ${'[Function: fn]'}
        ${() => {}}                      | ${'[Function]'}
        ${{}}                            | ${'{}'}
        ${{ toString }}                  | ${'toString() Used'}
        ${new Error('my err msg')}       | ${expect.stringContaining('Error: my err msg\nStack:')}
        ${{ toString: genThrow('err') }} | ${'Error: err'}
        ${/.*/g}                         | ${'/.*/g'}
        ${[1, 2, 3, /\d+/g]}             | ${'[1, 2, 3, /\\d+/g]'}
        ${testObj}                       | ${'{ toString: "toString value", a: { a: 1, b: 2 }, r: /.*/g, circular: [Circular] }'}
    `('format $value', ({ value, expected }) => {
        expect(format(value)).toEqual(expected);
    });
});

function genThrow(msg: string): () => never {
    return () => {
        throw new Error(msg);
    };
}

function toString(): string {
    return 'toString() Used';
}

function fn(): void {}
