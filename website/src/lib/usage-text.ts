import type { RegExpLike } from 'regexp-worker';

export const usageText = `\
The \`regexp-worker\` worker will run regular expressions in a web worker.

This is useful to help avoid blocking the main thread when running complex or long-running regular expressions.

It can be used to protect your application from untrusted regular expressions, as they will run in a separate thread.
If the regular expression takes too long to run, it will be terminated with a TimeoutError.

The example regular expression \`(?<=(^|\\s)\`).*?(?=\`(\\s|$))\` matches everything between \`back tick quotes\` on the same line.

Example Regular Expression with Catastrophic Backtracking: \`(x+x+)+y\` <-- use this expression.
Sample text: \`xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxy\` <-- remove the \`y\` to cause it to time out.

\`\`\`javascript
import { createRegExpWorker } from 'regexp-worker';

const worker = createRegExpWorker();
\`\`\`

`;

// cspell:ignore xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxy

export const defaultRegexp: RegExpLike = {
    source: `\
(^\`{3,}).*$[\\s\\S]*?\\1$       # Match against code blocks
| (hello(?<postfix>[a-z_-])) |   # Match against the word "hello"
(?<=(^|\\s)\`).*?(?=\`(\\s|$))   # Match against back tick quotes\
`,
    flags: 'gmx'
};
