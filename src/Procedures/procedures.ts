import type { Procedure } from './procedure.js';
import { procExecRegExp } from './procExecRegExp.js';
import { procMatchAllRegExp } from './procMatchAllRegExp.js';
import { procMatchAllRegExpArray } from './procMatchAllRegExpArray.js';
import { procMatchAllRegExpAsRange } from './procMatchAllRegExpAsRange.js';
import { procMatchRegExp } from './procMatchRegExp.js';

/**
 * Collection of all procedures related to regular expressions.
 * Order is important for the worker, as it processes them sequentially.
 */
export const procedures: Procedure[] = [
    procMatchAllRegExp, // expected to be the most frequently used
    procMatchAllRegExpAsRange,
    procExecRegExp,
    procMatchAllRegExpArray,
    procMatchRegExp,
];
