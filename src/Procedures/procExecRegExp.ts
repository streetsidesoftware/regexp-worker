import { format } from 'util';

import type { ExecRegExpResult } from '../helpers/evaluateRegExp.js';
import { execRegExp, toRegExp } from '../helpers/evaluateRegExp.js';
import {
    createErrorResponse,
    createRequest,
    createResponse,
    type ErrorResponse,
    isRequestType,
    isResponseType,
    type Request,
    type Response,
} from './procedure.js';

export type ExecRegExpRequestType = 'ExecRegExp';
export type ExecRegExpResponseType = ExecRegExpRequestType;
export const requestTypeExecRegExp: ExecRegExpRequestType = 'ExecRegExp';

export interface RequestExecRegExpData {
    text: string;
    regexp: RegExp;
}

export type RequestExecRegExp = Request<ExecRegExpRequestType, RequestExecRegExpData>;
export type ResponseExecRegExp = Response<ExecRegExpResponseType, ExecRegExpResult>;

export function isExecRegExpRequest(v: unknown): v is RequestExecRegExp {
    return isRequestType(v, requestTypeExecRegExp);
}

export function isExecRegExpResponse(v: unknown): v is ResponseExecRegExp {
    return isResponseType(v, requestTypeExecRegExp);
}

export function procExecRegExp(r: RequestExecRegExp): ResponseExecRegExp | ErrorResponse<ExecRegExpRequestType>;
export function procExecRegExp(r: Request): ResponseExecRegExp | ErrorResponse<ExecRegExpRequestType> | undefined;
export function procExecRegExp(r: RequestExecRegExp | Request): ResponseExecRegExp | ErrorResponse | undefined {
    if (!isExecRegExpRequest(r)) return undefined;
    try {
        const regex = toRegExp(r.data.regexp);
        return createResponseExecRegExp(r, execRegExp(regex, r.data.text));
    } catch (e) {
        return createErrorResponse(r, format(e));
    }
}

export function createRequestExecRegExp(data: RequestExecRegExpData): RequestExecRegExp {
    return createRequest(requestTypeExecRegExp, data);
}

export function createResponseExecRegExp(request: RequestExecRegExp, data: ResponseExecRegExp['data']): ResponseExecRegExp {
    return createResponse(request.id, request.requestType, data);
}
