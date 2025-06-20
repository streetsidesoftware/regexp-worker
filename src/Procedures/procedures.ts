import type { Procedure } from './procedure.js';
import { procExecRegExp } from './procExecRegExp.js';
import { procExecRegExpMatrix } from './procExecRegExpMatrix.js';
import { procMatchRegExp } from './procMatchRegExp.js';
import { procMatchRegExpArray } from './procMatchRegExpArray.js';

export const procedures: Procedure[] = [procExecRegExp, procExecRegExpMatrix, procMatchRegExp, procMatchRegExpArray];
