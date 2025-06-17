import fs from 'node:fs/promises';

async function run() {
    const workerURL = new URL('../lib/workerCodeNode.js', import.meta.url);
    const workerCode = await fs.readFile(workerURL, 'base64');
    const data = splitIntoLines(workerCode);

    const code = `
// This file is auto-generated. Do not edit manually.
// cspell\x3a disable

// eslint-disable-next-line quotes
export const workerCodeDataURL: string = \`data:application/javascript;base64,\\\n${data.map((line) => line + '\\\n').join('')}\`;
`;

    const outputURL = new URL('../src/worker/workerCodeDataURL.ts', import.meta.url);
    await fs.writeFile(outputURL, code, 'utf8');
}

/**
 *
 * @param {string} code
 * @returns {string[]}
 */
function splitIntoLines(code) {
    const lines = [];
    const lineLen = 80;
    let i = 0;
    for (i = 0; i + lineLen < code.length; i += lineLen) {
        lines.push(code.substring(i, i + lineLen));
    }
    if (i < code.length) {
        lines.push(code.substring(i));
    }

    return lines;
}

run();
