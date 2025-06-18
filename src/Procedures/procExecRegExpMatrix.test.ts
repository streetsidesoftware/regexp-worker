import { describe, test, expect } from 'vitest';
import { createRequestExecRegExpMatrix, procExecRegExpMatrix, isExecRegExpMatrixResponse } from './procExecRegExpMatrix.js';
import type { Request } from './procedure.js';
import { createId } from './uniqueId.js';

describe('procExecRegExpMatrix', () => {
    test('basic', () => {
        const req = createRequestExecRegExpMatrix({ textArray: ['two words'], regExpArray: [/w\w+/g] });
        const result = procExecRegExpMatrix(req);
        expect(isExecRegExpMatrixResponse(result)).toBe(true);
        const response = isExecRegExpMatrixResponse(result) ? result : undefined;
        expect(response?.data.elapsedTimeMs).toBeGreaterThan(0);
        expect(response?.data.matrix).toHaveLength(1);
        expect(response?.data.matrix[0].results[0].matches.map((m) => m[0])).toEqual(['wo', 'words']);
    });

    test('non-RequestExecRegExpMatrix', () => {
        const req: Request = { id: createId(), requestType: 'unknown', data: { text: 'two words', regexp: /w\w+/g } };
        const result = procExecRegExpMatrix(req);
        expect(isExecRegExpMatrixResponse(result)).toBe(false);
        expect(result).toBeUndefined();
    });
});
