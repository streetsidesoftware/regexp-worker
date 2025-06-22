import fs from 'node:fs/promises';

const targetSourceDir = new URL('../lib/', import.meta.url);
const targetOutDir = new URL('../src/worker/', import.meta.url);

const targets = ['workerCodeNode.js', 'workerCodeBrowser.js'];

async function process(workerURL, outputURL) {
    const workerCode = await fs.readFile(workerURL, 'base64');
    const data = splitIntoLines(workerCode);

    const code = `\
// This file is auto-generated. Do not edit manually.
// cspell\x3a disable

// eslint-disable-next-line quotes
export const workerCodeDataURL: string = \`data:application/javascript;base64,\\\n${data.map((line) => line + '\\\n').join('')}\`;
`;

    await fs.writeFile(outputURL, code, 'utf8');
}

/**
 *
 * @param {string} target
 * @returns {[src: URL, dst: URL]}
 */
function targetToSrcDst(target) {
    const sourceURL = new URL(target, targetSourceDir);
    const outputURL = new URL(target.replace('.js', 'DataURL.ts'), targetOutDir);
    return [sourceURL, outputURL];
}

async function run() {
    for (const target of targets) {
        try {
            const [workerURL, outputURL] = targetToSrcDst(target);
            console.log(`Process: ${target}\n ${workerURL} -> ${outputURL}`);
            await process(workerURL, outputURL);
            console.log('done.');
        } catch (error) {
            console.error(`Error processing ${workerURL}:`, error);
        }
    }
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
