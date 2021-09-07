import { createRequestMatchRegExpArray, procMatchRegExpArray, isMatchRegExpArrayResponse } from './procMatchRegExpArray';
import { Request, isErrorResponse } from './procedure';
import { createId } from './uniqueId';

describe('procMatchRegExpArray', () => {
    test('basic', () => {
        const req = createRequestMatchRegExpArray({ text: 'two words', regexps: [/w\w+/g] });
        const result = procMatchRegExpArray(req);
        expect(isMatchRegExpArrayResponse(result)).toBe(true);
        const response = isMatchRegExpArrayResponse(result) ? result : undefined;
        expect(response?.data.elapsedTimeMs).toBeGreaterThan(0);
        expect(response?.data.results[0].ranges).toEqual(new Uint32Array([1, 3, 4, 9]));
    });

    test('non-RequestMatchRegExpArray', () => {
        const req: Request = { id: createId(), requestType: 'unknown', data: { text: 'two words', regexps: [/w\w+/g] } };
        const result = procMatchRegExpArray(req);
        expect(isMatchRegExpArrayResponse(result)).toBe(false);
        expect(result).toBeUndefined();
    });

    test('RequestExecRegExp bad regex', () => {
        const req: Request = createRequestMatchRegExpArray({ text: 'two words', regexps: ['/[/g'] });
        const result = procMatchRegExpArray(req);
        const response = isErrorResponse(result) ? result : undefined;
        expect(isMatchRegExpArrayResponse(result)).toBe(false);
        expect(isErrorResponse(result)).toBe(true);
        expect(response?.id).toBe(req.id);
        expect(response?.data.requestType).toBe(req.requestType);
        expect(response?.data.message).toContain('SyntaxError');
    });
});
