import { describe, test, expect } from 'vitest';
import { createRequestMatchRegExp, procMatchRegExp, isMatchRegExpResponse } from './procMatchRegExp.js';
import type { Request } from './procedure.js';
import { isErrorResponse } from './procedure.js';
import { createId } from './uniqueId.js';

describe('procMatchRegExp', () => {
    test('basic', () => {
        const req = createRequestMatchRegExp({ text: 'two words', regexp: /w\w+/g });
        const result = procMatchRegExp(req);
        expect(isMatchRegExpResponse(result)).toBe(true);
        const response = isMatchRegExpResponse(result) ? result : undefined;
        expect(response?.data.elapsedTimeMs).toBeGreaterThan(0);
        expect(response?.data.ranges).toEqual(new Uint32Array([1, 3, 4, 9]));
    });

    test('non-RequestMatchRegExp', () => {
        const req: Request = { id: createId(), requestType: 'unknown', data: { text: 'two words', regexp: /w\w+/g } };
        const result = procMatchRegExp(req);
        expect(isMatchRegExpResponse(result)).toBe(false);
        expect(result).toBeUndefined();
    });

    test('RequestExecRegExp bad regex', () => {
        const req: Request = createRequestMatchRegExp({ text: 'two words', regexp: '/[/g' });
        const result = procMatchRegExp(req);
        const response = isErrorResponse(result) ? result : undefined;
        expect(isMatchRegExpResponse(result)).toBe(false);
        expect(isErrorResponse(result)).toBe(true);
        expect(response?.id).toBe(req.id);
        expect(response?.data.requestType).toBe(req.requestType);
        expect(response?.data.message).toContain('SyntaxError');
    });
});
