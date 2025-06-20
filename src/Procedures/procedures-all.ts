import { procEcho } from './procEcho.js';
import type { Procedure } from './procedure.js';
import { procExecRegExp } from './procExecRegExp.js';
import { procSleep } from './procSleep.js';
import { procSpin } from './procSpin.js';
import { procExecRegExpMatrix } from './procExecRegExpMatrix.js';
import { procGenError } from './procGenError.js';
import { procMatchRegExpArray } from './procMatchRegExpArray.js';
import { procMatchRegExp } from './procMatchRegExp.js';

/**
 * List of all procedures available in the worker.
 * This is used only for testing purposes.
 */
export const procedures: Procedure[] = [
    procExecRegExp,
    procExecRegExpMatrix,
    procMatchRegExp,
    procMatchRegExpArray,
    procEcho,
    procSleep,
    procSpin,
    procGenError,
];
