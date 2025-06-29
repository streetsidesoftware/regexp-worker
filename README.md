# Regular Expression Worker

Execute Regular Expression Matches on a Node [Worker Thread](https://nodejs.org/api/worker_threads.html) or in a [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Worker).

Regular Expressions can suffer from [Catastrophic Backtracking](https://www.regular-expressions.info/catastrophic.html). A very simple expression like `/(x+x+)+y/` can cause your JavaScript application to freeze. This library allows you to run these expressions on another thread. If they take to long to complete, they are terminated, protecting your application from locking up.

Try it out: [`regexp-worker` Playground](https://streetsidesoftware.com/regexp-worker/)

## Installation

```
npm install regexp-worker
```

## Basic Usage

In the example below:

1. a new Worker thread is created
1. the regular expression is executed on the thread
1. the result is returned
1. the thread is stopped

For the occasional request, this is the easiest way, but the Worker startup and shutdown is expensive.

### Find the words in some text

<!--- @@inject: ./examples/example-words.js --->

```js
import { workerMatchAll } from 'regexp-worker';
//...
const response = await workerMatchAll('Good Morning', /\b\w+/g);
console.log(response.matches.map((m) => m[0]));
```

<!--- @@inject-end: ./examples/example-words.js --->

Result:

<!--- @@inject: ./examples/output/example-words.js.out.txt --->

```
[ 'Good', 'Morning' ]
```

<!--- @@inject-end: ./examples/output/example-words.js.out.txt --->

### Find the word breaks in some text

<!--- @@inject: ./examples/example-indexes.js --->

```js
import { workerMatchAll } from 'regexp-worker';

const response = await workerMatchAll('Good Morning', /\b/g);
console.log(response.matches.map((m) => m.index));
```

<!--- @@inject-end: ./examples/example-indexes.js --->

Result:

<!--- @@inject-code: examples/output/example-indexes.js.out.txt --->

```
[ 0, 4, 5, 12 ]
```

<!--- @@inject-end: examples/output/example-indexes.js.out.txt --->

### Format of the response

```ts
export interface MatchAllRegExpResult {
    elapsedTimeMs: number;
    matches: RegExpMatchArray[];
}
```

Where `RegExpMatchArray` is [`RegExp.prototype[Symbol.matchAll]()` result](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec#Description).

## Creating a `RegExpWorker` Instance

To reduce the cost of starting and stopping the Worker, it is possible to create a `RegExpWorker` instance.
This instance allows you to make multiple requests using the same worker. The request are queued and handled
one at a time. If a request takes too long, it is terminated and the promise is rejected with an `ErrorCanceledRequest`.

```js
import { RegExpWorker } from 'regexp-worker';

// ...
const defaultTimeOutMs = 10;
const worker = new RegExpWorker(defaultTimeOutMs);

// Find all words in some text
let words = await worker.matchAll('Lots of text ...', /\b\w+/g);

// Find all numbers in some text
let numbers = await worker.matchAll('Lots of text ...', /\b\d+/g);

// Find 3 letter word pairs
let moreTimeMs = 100;
let numbers = await worker.matchAll('Lots of text ...', /\b\w{3}\s+\w{3}/g, moreTimeMs);

// ...

// It is a good idea to dispose of the worker before shutdown.
// The worker thread will stop on its own if left idle for more than 200ms.
await worker.dispose();
```

**Note:** The worker supports the proposed [`using`](https://github.com/tc39/proposal-explicit-resource-management) keyword. See also: [TypeScript: `using`](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html).

```ts
import { RegExpWorker } from 'regexp-worker';

async function run() {
    await using worker = new RegExpWorker();
    // ... do some work.
    let numbers = await worker.matchAll('Lots of text 123 ...', /\b\d+\b/g);
    // The worker is auto cleaned up when when the function exits.
}
```

## Handling Timeouts

If the request times out, the promise will be rejected with:

```js
class TimeoutError extends Error {
    message: string;
    elapsedTimeMs: number;
}
```

## Deno

Deno uses the Web Worker interface instead of `node:worker_threads`.
To make things easier, this library has been published to [jsr.io](https://jsr.io/@streetsidesoftware/regexp-worker) in addition to
adding a deno export to `package.json`.

**Example Using Deno:**

<!--- @@inject: ./examples/example.deno.ts --->

````ts
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
````

<!--- @@inject-end: ./examples/example.deno.ts --->
