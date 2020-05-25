import { Request } from './procedure';
import { procEcho } from './procEcho';
import { procExecRegExp } from './procExecRegExp';
import { procSleep } from './procSleep';
import { procSpin } from './procSpin';

type Procedure = (r: Request) => Promise<Response> | Response | undefined;

export const procedures: Procedure[]  = [
    procExecRegExp,
    procEcho,
    procSleep,
    procSpin,
];
