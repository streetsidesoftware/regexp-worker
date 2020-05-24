import { nullPort } from './MessagePort';

describe('MessagePort', () => {
    it('nullPort', () => {
        const p = nullPort;
        p.postMessage({});
        const fn = () => {};
        expect(p.on('message', fn)).toBe(p);
        expect(p.on('close', fn)).toBe(p);
        expect(p.off('message', fn)).toBe(p);
        expect(p.off('close', fn)).toBe(p);
    });
});
