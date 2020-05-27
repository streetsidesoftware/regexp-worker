import { Request } from './procedure';
import { procEcho } from './procEcho';
import { procExecRegExp } from './procExecRegExp';
import { procSleep } from './procSleep';
import { procSpin } from './procSpin';
import { procExecRegExpMatrix } from './procExecRegExpMatrix';

type Procedure = (r: Request) => Promise<Response> | Response | undefined;

export const procedures: Procedure[]  = [
    procExecRegExp,
    procExecRegExpMatrix,
    procEcho,
    procSleep,
    procSpin,
];
