import { Request } from './procedure';
import { procEcho } from './procEcho';
import { procExecRegExp } from './procExecRegExp';

type Procedure = (r: Request) => Response | undefined;

export const procedures: Procedure[]  = [
    procExecRegExp,
    procEcho,
];
