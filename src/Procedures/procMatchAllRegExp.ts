import { format } from 'util';
import type { MatchAllRegExpResult } from '../helpers/evaluateRegExp.js';
import { matchAllRegExp, toRegExp } from '../helpers/evaluateRegExp.js';
import type { ErrorResponse, Request, Response } from './procedure.js';
import { createErrorResponse, createRequest, createResponse, isRequestType, isResponseType } from './procedure.js';

export const requestTypeMatchAllRegExp = 'MatchAllRegExp';
export type MatchAllRegExpRequestType = typeof requestTypeMatchAllRegExp;
export type MatchAllRegExpResponseType = MatchAllRegExpRequestType;

export interface RequestMatchAllRegExpData {
    text: string;
    regexp: RegExp | string;
}

export type RequestMatchAllRegExp = Request<MatchAllRegExpRequestType, RequestMatchAllRegExpData>;
export type ResponseMatchAllRegExp = Response<MatchAllRegExpResponseType, MatchAllRegExpResult>;

export function isMatchAllRegExpRequest(v: unknown): v is RequestMatchAllRegExp {
    return isRequestType(v, requestTypeMatchAllRegExp);
}
export function isMatchAllRegExpResponse(v: unknown): v is ResponseMatchAllRegExp {
    return isResponseType(v, requestTypeMatchAllRegExp);
}

export function procMatchAllRegExp(r: RequestMatchAllRegExp): ResponseMatchAllRegExp | ErrorResponse<MatchAllRegExpResponseType>;
export function procMatchAllRegExp(r: Request): ResponseMatchAllRegExp | ErrorResponse<MatchAllRegExpResponseType> | undefined;
export function procMatchAllRegExp(r: RequestMatchAllRegExp | Request): ResponseMatchAllRegExp | ErrorResponse | undefined {
    if (!isMatchAllRegExpRequest(r)) return undefined;
    try {
        const regex = toRegExp(r.data.regexp);
        const regexResult = matchAllRegExp(r.data.text, regex);

        return createResponseMatchAllRegExp(r, regexResult);
    } catch (e) {
        return createErrorResponse(r, format(e));
    }
}

export function createRequestMatchAllRegExp(data: RequestMatchAllRegExp['data']): RequestMatchAllRegExp {
    return createRequest(requestTypeMatchAllRegExp, data);
}

export function createResponseMatchAllRegExp(request: RequestMatchAllRegExp, data: ResponseMatchAllRegExp['data']): ResponseMatchAllRegExp {
    return createResponse(request.id, request.requestType, data);
}
