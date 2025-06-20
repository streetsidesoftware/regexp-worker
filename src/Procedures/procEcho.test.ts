import { describe, test, expect } from 'vitest';
import { isEchoRequest, procEcho, createRequestEcho, isEchoResponse } from './procEcho.js';
import { createRequest, isErrorResponse } from './procedure.js';
import { createId } from './uniqueId.js';

describe('Echo', () => {
    test('isA', () => {
        expect(isEchoRequest({})).toBe(false);
        expect(isEchoRequest({ id: createId(), requestType: 'Echo' })).toBe(true);
        expect(isEchoRequest(createRequestEcho("G' day"))).toBe(true);
    });

    test('echo', () => {
        const id = createId();
        const r = procEcho({ id, requestType: 'Echo', data: 'hello' });
        expect(r.id).toBe(id);
        expect(r.responseType).toBe('Echo');
        expect(r.data).toBe('hello');
        expect(isEchoResponse(r)).toBe(true);
    });

    test('bad echo', () => {
        const req = createRequest('Echo', {});
        const r = procEcho(req);
        expect(isErrorResponse(r)).toBe(true);
    });
});
