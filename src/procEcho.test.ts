import { isEchoRequest, procEcho,  } from './procEcho';
import { createId } from './uniqueId';


describe('Commands', () => {
    test('isA', () => {
        expect(isEchoRequest({})).toBe(false);
        expect(isEchoRequest({ id: createId(), requestType: 'Echo' })).toBe(true);
    });

    test('echo', () => {
        const id = createId();
        const r = procEcho({ id, requestType: 'Echo', data: 'hello'});
        expect(r.id).toBe(id);
        expect(r.responseType).toBe('Echo');
        expect(r.data).toBe('hello');
    });
});
