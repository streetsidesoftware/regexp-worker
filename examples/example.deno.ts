/**
 * @file example.deno.ts
 * @description Example of using the `@streetsidesoftware/regexp-worker` package in Deno
 * to extract email addresses from a sample text using a Worker.
 *
 * Install:
 * ```sh
 * deno add jsr:@streetsidesoftware/regexp-worker
 * deno example.deno.ts # run this file.
 * ```
 */

import { createRegExpWorker } from '@streetsidesoftware/regexp-worker';

const sampleText = `
This is a sample text with some email addresses:
- tim@ge.com
- bill@microsoft.com
`;

const regexpEmail = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

export async function getEmails(text: string): Promise<string[]> {
    await using worker = await createRegExpWorker();

    const result = await worker.matchAll(text, regexpEmail);
    return result.matches.map((match) => match[0]);
}

export async function run() {
    const emails = await getEmails(sampleText);
    console.log('Extracted emails:', emails);
}

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
    run();
}
