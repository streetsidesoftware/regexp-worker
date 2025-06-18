import { describe, test, expect } from 'vitest';
import type { RequestExecRegExp } from './procExecRegExp.js';
import { createRequestExecRegExp, procExecRegExp, isExecRegExpResponse, requestTypeExecRegExp } from './procExecRegExp.js';
import type { Request } from './procedure.js';
import { createRequest, isErrorResponse } from './procedure.js';
import { createId } from './uniqueId.js';

describe('procExecRegExp', () => {
    test('basic', () => {
        const req = createRequestExecRegExp({ text: 'two words', regexp: /w\w+/g });
        const result = procExecRegExp(req);
        expect(isExecRegExpResponse(result)).toBe(true);
        const response = isExecRegExpResponse(result) ? result : undefined;
        expect(response?.data.elapsedTimeMs).toBeGreaterThan(0);
        expect(response?.data.matches).toHaveLength(2);
        expect(response?.data.matches.map((m) => m[0])).toEqual(['wo', 'words']);
    });

    test('non-RequestExecRegExp', () => {
        const req: Request = { id: createId(), requestType: 'unknown', data: { text: 'two words', regexp: /w\w+/g } };
        const result = procExecRegExp(req);
        expect(isExecRegExpResponse(result)).toBe(false);
        expect(result).toBeUndefined();
    });

    test('RequestExecRegExp bad regex', () => {
        const req: RequestExecRegExp = createRequest(requestTypeExecRegExp, { text: 'two words', regexp: '/[/g' });
        const result = procExecRegExp(req);
        const response = isErrorResponse(result) ? result : undefined;
        expect(isExecRegExpResponse(result)).toBe(false);
        expect(isErrorResponse(result)).toBe(true);
        expect(response?.id).toBe(req.id);
        expect(response?.data.requestType).toBe(requestTypeExecRegExp);
        expect(response?.data.message).toContain('SyntaxError');
    });

    test('RequestExecRegExp missing regex', () => {
        const req: RequestExecRegExp = createRequest(requestTypeExecRegExp, { text: 'two words', regexp: '' });
        delete (req as any).data.regexp;
        const result = procExecRegExp(req);
        const response = isErrorResponse(result) ? result : undefined;
        expect(response?.id).toBe(req.id);
        expect(response?.data.message).toContain('TypeError');
    });

    test('RequestExecRegExp missing data', () => {
        const req: RequestExecRegExp = createRequest(requestTypeExecRegExp, { text: 'two words', regexp: '/./g' });
        delete (req as any).data;
        const result = procExecRegExp(req);
        const response = isErrorResponse(result) ? result : undefined;
        expect(response?.id).toBe(req.id);
        expect(response?.data.message).toContain('TypeError');
    });

    test('RequestExecRegExp data is a number', () => {
        const req: RequestExecRegExp = createRequest(requestTypeExecRegExp, { text: 'two words', regexp: '/./g' });
        Object.assign(req, { data: 42 });
        const result = procExecRegExp(req);
        const response = isErrorResponse(result) ? result : undefined;
        expect(response?.id).toBe(req.id);
        expect(response?.data.message).toContain('TypeError');
    });
});
