import { createRequestExecRegExp, procExecRegExp, isExecRegExpResponse, requestTypeExecRegExp, RequestExecRegExp } from './procExecRegExp';
import { Request, createRequest, isErrorResponse } from './procedure';

describe('procExecRegExp', () => {
    test('basic', () => {
        const req = createRequestExecRegExp(5, { text: 'two words', regexp: /w\w+/g });
        const result = procExecRegExp(req);
        expect(isExecRegExpResponse(result)).toBe(true);
        const response = isExecRegExpResponse(result) ? result : undefined;
        expect(response?.data.elapsedTimeMs).toBeGreaterThan(0);
        expect(response?.data.matches).toHaveLength(2);
        expect(response?.data.matches.map(m => m[0])).toEqual(['wo', 'words'])
    });

    test('non-RequestExecRegExp', () => {
        const req: Request = { id: 5, requestType: 'unknown', data: { text: 'two words', regexp: /w\w+/g }};
        const result = procExecRegExp(req);
        expect(isExecRegExpResponse(result)).toBe(false);
        expect(result).toBeUndefined();
    });

    test('RequestExecRegExp bad regex', () => {
        const req: RequestExecRegExp = createRequest(5, requestTypeExecRegExp, { text: 'two words', regexp: '/[/g' });
        const result = procExecRegExp(req);
        const response = isErrorResponse(result) ? result : undefined;
        expect(isExecRegExpResponse(result)).toBe(false);
        expect(isErrorResponse(result)).toBe(true);
        expect(response?.id).toBe(5);
        expect(response?.data.requestType).toBe(requestTypeExecRegExp);
        expect(response?.data.message).toContain('SyntaxError');
    });

    test('RequestExecRegExp missing regex', () => {
        const req: RequestExecRegExp = createRequest(5, requestTypeExecRegExp, { text: 'two words', regexp: '' });
        delete req.data.regexp;
        const result = procExecRegExp(req);
        const response = isErrorResponse(result) ? result : undefined;
        expect(response?.data.message).toContain('TypeError');
    });

    test('RequestExecRegExp missing data', () => {
        const req: RequestExecRegExp = createRequest(5, requestTypeExecRegExp, { text: 'two words', regexp: '/./g' });
        delete req.data;
        const result = procExecRegExp(req);
        const response = isErrorResponse(result) ? result : undefined;
        expect(response?.data.message).toContain('TypeError');
    });

    test('RequestExecRegExp data is a number', () => {
        const req: RequestExecRegExp = createRequest(5, requestTypeExecRegExp, { text: 'two words', regexp: '/./g' });
        Object.assign(req, { data: 42 })
        const result = procExecRegExp(req);
        const response = isErrorResponse(result) ? result : undefined;
        expect(response?.data.message).toContain('TypeError');
    });
});
