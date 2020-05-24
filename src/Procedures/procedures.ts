import { Request } from './procedure';
import { procEcho } from './procEcho';
import { procExecRegExp } from './procExecRegExp';
import { procSleep } from './procSleep';

type Procedure = (r: Request) => Promise<Response> | Response | undefined;

export const procedures: Procedure[]  = [
    procExecRegExp,
    procEcho,
    procSleep,
];
