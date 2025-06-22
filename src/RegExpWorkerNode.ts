export type { ExecRegExpResult, MatchAllRegExpArrayResult, MatchAllRegExpResult, MatchRegExpResult } from './RegExpWorker.js';
export { RegExpWorker, timeoutRejection, toRegExp, workerExec, workerMatch, workerMatchAll, workerMatchAllArray } from './RegExpWorker.js';

import { setCreateWorker } from './worker/di.js';
import { createWorkerNode } from './worker/workerNode.js';

setCreateWorker(createWorkerNode);
