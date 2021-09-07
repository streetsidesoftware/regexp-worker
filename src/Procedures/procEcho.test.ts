import { isEchoRequest, procEcho, createRequestEcho } from './procEcho';
import { createRequest, isErrorResponse } from './procedure';
import { createId } from './uniqueId';

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
    });

    test('bad echo', () => {
        const req = createRequest('Echo', {});
        const r = procEcho(req);
        expect(isErrorResponse(r)).toBe(true);
    });
});
