import { describe, expect, test } from 'vitest';

import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import Path from 'node:path';

const testDir = fileURLToPath(new URL('.', import.meta.url));

describe('Ensure the examples work as expected.', () => {
    test.each`
        file
        ${'example-indexes.cjs'}
        ${'example-indexes.js'}
        ${'example-words.cjs'}
        ${'example-words.js'}
    `('exec file and test output: $file', async ({ file }) => {
        const filePath = Path.join(testDir, file);
        const snapPath = Path.join(testDir, 'output', file + '.out.txt');
        const result = execSync('node "' + filePath + '"', { encoding: 'utf8' });
        await expect(result).toMatchFileSnapshot(snapPath);
    });
});
