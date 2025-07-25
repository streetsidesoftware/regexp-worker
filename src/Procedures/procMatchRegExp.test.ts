import { describe, expect, test } from 'vitest';

import type { Request } from './procedure.js';
import { isErrorResponse } from './procedure.js';
import { createRequestMatchRegExp, isMatchRegExpResponse, procMatchRegExp } from './procMatchRegExp.js';
import { createId } from './uniqueId.js';

describe('procMatchRegExp', () => {
    test('basic', () => {
        const text = 'two words';
        const regexp = /w\w+/g;
        const req = createRequestMatchRegExp({ text, regexp });
        const result = procMatchRegExp(req);
        expect(isMatchRegExpResponse(result)).toBe(true);
        const response = isMatchRegExpResponse(result) ? result : undefined;
        expect(response?.data.elapsedTimeMs).toBeGreaterThan(0);
        expect(response?.data.match).toEqual(text.match(regexp));
    });

    test('non-RequestMatchRegExp', () => {
        const req: Request = { id: createId(), requestType: 'unknown', data: { text: 'two words', regexp: /w\w+/g } };
        const result = procMatchRegExp(req);
        expect(isMatchRegExpResponse(result)).toBe(false);
        expect(result).toBeUndefined();
    });

    test('RequestExecRegExp bad regex', () => {
        const req: Request = createRequestMatchRegExp({ text: 'two words', regexp: { source: '[', flags: 'g' } });
        const result = procMatchRegExp(req);
        const response = isErrorResponse(result) ? result : undefined;
        expect(isMatchRegExpResponse(result)).toBe(false);
        expect(isErrorResponse(result)).toBe(true);
        expect(response?.id).toBe(req.id);
        expect(response?.data.requestType).toBe(req.requestType);
        expect(response?.data.message).toContain('SyntaxError');
    });
});
