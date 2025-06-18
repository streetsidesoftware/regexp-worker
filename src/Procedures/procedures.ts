import type { Request } from './procedure.js';
import { procEcho } from './procEcho.js';
import { procExecRegExp } from './procExecRegExp.js';
import { procSleep } from './procSleep.js';
import { procSpin } from './procSpin.js';
import { procExecRegExpMatrix } from './procExecRegExpMatrix.js';
import { procGenError } from './procGenError.js';
import { procMatchRegExpArray } from './procMatchRegExpArray.js';
import { procMatchRegExp } from './procMatchRegExp.js';

type Procedure = (r: Request) => any;

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
