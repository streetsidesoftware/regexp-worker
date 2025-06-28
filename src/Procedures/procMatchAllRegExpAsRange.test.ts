import { describe, expect, test } from 'vitest';

import type { Request } from './procedure.js';
import { isErrorResponse } from './procedure.js';
import type { RequestMatchAllRegExpAsRange } from './procMatchAllRegExpAsRange.js';
import {
    createRequestMatchAllRegExpAsRange,
    isMatchAllRegExpAsRangeResponse,
    procMatchAllRegExpAsRange,
} from './procMatchAllRegExpAsRange.js';
import { createId } from './uniqueId.js';

describe('procMatchAllRegExpAsRange', () => {
    test('basic', () => {
        const text = 'two words';
        const regexp = /w\w+/g;
        const req = createRequestMatchAllRegExpAsRange({ text, regexp });
        const result = procMatchAllRegExpAsRange(req);
        expect(isMatchAllRegExpAsRangeResponse(result)).toBe(true);
        const response = isMatchAllRegExpAsRangeResponse(result) ? result : undefined;
        expect(response?.data.elapsedTimeMs).toBeGreaterThan(0);
        expect(response?.data.ranges).toEqual(
            Uint32Array.from(Array.from(text.matchAll(regexp)).flatMap((match) => [match.index, match.index + match[0].length])),
        );
    });

    test('non-RequestMatchAllRegExpAsRange', () => {
        const req: Request = { id: createId(), requestType: 'unknown', data: { text: 'two words', regexp: /w\w+/g } };
        const result = procMatchAllRegExpAsRange(req);
        expect(isMatchAllRegExpAsRangeResponse(result)).toBe(false);
        expect(result).toBeUndefined();
    });

    test('RequestExecRegExp bad regex', () => {
        const req: RequestMatchAllRegExpAsRange = createRequestMatchAllRegExpAsRange({ text: 'two words', regexp: /\[/g });
        Object.assign(req.data, { regexp: { source: '[', flags: 'g' } });
        const result = procMatchAllRegExpAsRange(req);
        const response = isErrorResponse(result) ? result : undefined;
        expect(isMatchAllRegExpAsRangeResponse(result)).toBe(false);
        expect(isErrorResponse(result)).toBe(true);
        expect(response?.id).toBe(req.id);
        expect(response?.data.requestType).toBe(req.requestType);
        expect(response?.data.message).toContain('SyntaxError');
    });
});
