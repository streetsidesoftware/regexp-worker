import { procEcho } from './procEcho.js';
import type { Procedure } from './procedure.js';
import { procExecRegExp } from './procExecRegExp.js';
import { procGenError } from './procGenError.js';
import { procMatchAllRegExp } from './procMatchAllRegExp.js';
import { procMatchAllRegExpArray } from './procMatchAllRegExpArray.js';
import { procSleep } from './procSleep.js';
import { procSpin } from './procSpin.js';

/**
 * List of all procedures available in the worker.
 * This is used only for testing purposes.
 */
export const procedures: Procedure[] = [
    procExecRegExp,
    procMatchAllRegExp,
    procMatchAllRegExpArray,
    procEcho,
    procSleep,
    procSpin,
    procGenError,
];
