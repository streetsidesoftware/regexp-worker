import { describe, expect, test } from 'vitest';

import type { Request } from './procedure.js';
import { isErrorResponse } from './procedure.js';
import { createRequestMatchRegExpArray, isMatchRegExpArrayResponse, procMatchAllRegExpArray } from './procMatchAllRegExpArray.js';
import { createId } from './uniqueId.js';

describe('procMatchRegExpArray', () => {
    test('basic', () => {
        const text = 'two words';
        const regex = /w\w+/g;
        const regexps = [regex];
        const req = createRequestMatchRegExpArray({ text, regexps });
        const result = procMatchAllRegExpArray(req);
        expect(isMatchRegExpArrayResponse(result)).toBe(true);
        const response = isMatchRegExpArrayResponse(result) ? result : undefined;
        expect(response?.data.elapsedTimeMs).toBeGreaterThan(0);
        expect(response?.data.results[0].matches).toEqual(Array.from(text.matchAll(regex)));
    });

    test('non-RequestMatchRegExpArray', () => {
        const req: Request = { id: createId(), requestType: 'unknown', data: { text: 'two words', regexps: [/w\w+/g] } };
        const result = procMatchAllRegExpArray(req);
        expect(isMatchRegExpArrayResponse(result)).toBe(false);
        expect(result).toBeUndefined();
    });

    test('RequestExecRegExp bad regex', () => {
        const req: Request = createRequestMatchRegExpArray({ text: 'two words', regexps: [/\[/g] });
        Object.assign(req.data as string[], { regexps: ['/[/g'] }); // Intentionally malformed regex
        const result = procMatchAllRegExpArray(req);
        const response = isErrorResponse(result) ? result : undefined;
        expect(isMatchRegExpArrayResponse(result)).toBe(false);
        expect(isErrorResponse(result)).toBe(true);
        expect(response?.id).toBe(req.id);
        expect(response?.data.requestType).toBe(req.requestType);
        expect(response?.data.message).toContain('SyntaxError');
    });
});
