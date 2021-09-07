import { Request } from './procedure';
import { procEcho } from './procEcho';
import { procExecRegExp } from './procExecRegExp';
import { procSleep } from './procSleep';
import { procSpin } from './procSpin';
import { procExecRegExpMatrix } from './procExecRegExpMatrix';
import { procGenError } from './procGenError';
import { procMatchRegExpArray } from './procMatchRegExpArray';
import { procMatchRegExp } from './procMatchRegExp';

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
