import { describe, expect, test } from 'vitest';

import type { Request } from './procedure.js';
import { isErrorResponse } from './procedure.js';
import type { RequestMatchAllRegExp } from './procMatchAllRegExp.js';
import { createRequestMatchAllRegExp, isMatchAllRegExpResponse, procMatchAllRegExp } from './procMatchAllRegExp.js';
import { createId } from './uniqueId.js';

describe('procMatchAllRegExp', () => {
    test('basic', () => {
        const text = 'two words';
        const regexp = /w\w+/dg;
        const req = createRequestMatchAllRegExp({ text, regexp });
        const result = procMatchAllRegExp(req);
        expect(isMatchAllRegExpResponse(result)).toBe(true);
        const response = isMatchAllRegExpResponse(result) ? result : undefined;
        expect(response?.data.elapsedTimeMs).toBeGreaterThan(0);
        expect(response?.data.matches).toEqual(Array.from(text.matchAll(regexp)).map((m) => m.indices));
    });

    test('non-RequestMatchAllRegExp', () => {
        const req: Request = { id: createId(), requestType: 'unknown', data: { text: 'two words', regexp: /w\w+/g } };
        const result = procMatchAllRegExp(req);
        expect(isMatchAllRegExpResponse(result)).toBe(false);
        expect(result).toBeUndefined();
    });

    test('RequestExecRegExp bad regex', () => {
        const req: RequestMatchAllRegExp = createRequestMatchAllRegExp({ text: 'two words', regexp: /\[/g });
        Object.assign(req.data, { regexp: { source: '[', flags: 'g' } });
        const result = procMatchAllRegExp(req);
        const response = isErrorResponse(result) ? result : undefined;
        expect(isMatchAllRegExpResponse(result)).toBe(false);
        expect(isErrorResponse(result)).toBe(true);
        expect(response?.id).toBe(req.id);
        expect(response?.data.requestType).toBe(req.requestType);
        expect(response?.data.message).toContain('SyntaxError');
    });
});
