import { isEchoRequest, procEcho,  } from './procEcho';


describe('Commands', () => {
    test('isA', () => {
        expect(isEchoRequest({})).toBe(false);
        expect(isEchoRequest({ id: 1, requestType: 'Echo'})).toBe(true);
    });

    test('echo', () => {
        const r = procEcho({ id: 2, requestType: 'Echo', data: 'hello'});
        expect(r.id).toBe(2);
        expect(r.responseType).toBe('Echo');
        expect(r.data).toBe('hello');
    });
});
