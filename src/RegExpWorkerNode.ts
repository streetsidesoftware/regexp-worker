export { workerExec, workerMatch, workerMatchAll, workerMatchAllArray, RegExpWorker, toRegExp, timeoutRejection } from './RegExpWorker.js';
export type { ExecRegExpResult, MatchAllRegExpArrayResult, MatchRegExpResult, MatchAllRegExpResult } from './RegExpWorker.js';

import { createWorkerNode } from './worker/workerNode.js';
import { setCreateWorker } from './worker/di.js';

setCreateWorker(createWorkerNode);
