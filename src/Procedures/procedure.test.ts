import { describe, it, expect } from 'vitest';
import { isRequest } from './procedure.js';
import { createId } from './uniqueId.js';

describe('procedures', () => {
    it('isA', () => {
        expect(isRequest({})).toBe(false);
        expect(isRequest({ id: createId(), requestType: 'Echo' })).toBe(true);
        expect(isRequest({ id: createId(), requestType: 'Other' })).toBe(true);
        expect(isRequest({ id: '5', requestType: 'Other' })).toBe(false);
        expect(isRequest({ id: createId(), requestType: undefined })).toBe(false);
    });
});
