import type { Procedure } from './procedure.js';
import { procExecRegExp } from './procExecRegExp.js';
import { procMatchAllRegExp } from './procMatchAllRegExp.js';
import { procMatchAllRegExpArray } from './procMatchAllRegExpArray.js';
import { procMatchRegExp } from './procMatchRegExp.js';

export const procedures: Procedure[] = [procExecRegExp, procMatchAllRegExp, procMatchAllRegExpArray, procMatchRegExp];
