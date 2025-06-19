import { format } from 'util';
import type { MatchRegExpResult } from '../helpers/evaluateRegExp.js';
import { matchRegExp, toRegExp } from '../helpers/evaluateRegExp.js';
import type { ErrorResponse, Request, Response } from './procedure.js';
import { createErrorResponse, createRequest, createResponse, isRequestType, isResponseType } from './procedure.js';

export const requestTypeMatchRegExp = 'MatchRegExp';
export type MatchRegExpRequestType = typeof requestTypeMatchRegExp;
export type MatchRegExpResponseType = MatchRegExpRequestType;

export interface RequestMatchRegExpData {
    text: string;
    regexp: RegExp | string;
}

export type RequestMatchRegExp = Request<MatchRegExpRequestType, RequestMatchRegExpData>;
export type ResponseMatchRegExp = Response<MatchRegExpResponseType, MatchRegExpResult>;

export function isMatchRegExpRequest(v: unknown): v is RequestMatchRegExp {
    return isRequestType(v, requestTypeMatchRegExp);
}
export function isMatchRegExpResponse(v: unknown): v is ResponseMatchRegExp {
    return isResponseType(v, requestTypeMatchRegExp);
}

export function procMatchRegExp(r: RequestMatchRegExp): ResponseMatchRegExp | ErrorResponse<MatchRegExpResponseType>;
export function procMatchRegExp(r: Request): ResponseMatchRegExp | ErrorResponse<MatchRegExpResponseType> | undefined;
export function procMatchRegExp(r: RequestMatchRegExp | Request): ResponseMatchRegExp | ErrorResponse | undefined {
    if (!isMatchRegExpRequest(r)) return undefined;
    try {
        const regex = toRegExp(r.data.regexp);
        const regexResult = matchRegExp(r.data.text, regex);

        return createResponseMatchRegExp(r, regexResult);
    } catch (e) {
        return createErrorResponse(r, format(e));
    }
}

export function createRequestMatchRegExp(data: RequestMatchRegExp['data']): RequestMatchRegExp {
    return createRequest(requestTypeMatchRegExp, data);
}

export function createResponseMatchRegExp(request: RequestMatchRegExp, data: ResponseMatchRegExp['data']): ResponseMatchRegExp {
    return createResponse(request.id, request.requestType, data);
}
