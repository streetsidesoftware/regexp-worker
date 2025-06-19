import { format } from 'util';
import type { MatchRegExpArrayResult } from '../helpers/evaluateRegExp.js';
import { matchRegExpArray, toRegExp } from '../helpers/evaluateRegExp.js';
import type { ErrorResponse, Request, Response } from './procedure.js';
import { createErrorResponse, createRequest, createResponse, isRequestType, isResponseType } from './procedure.js';

export const requestTypeMatchRegExpArray = 'MatchRegExpArray';
export type MatchRegExpArrayRequestType = typeof requestTypeMatchRegExpArray;
export type MatchRegExpArrayResponseType = MatchRegExpArrayRequestType;

export interface RequestMatchRegExpArray extends Request {
    requestType: MatchRegExpArrayRequestType;
    data: {
        text: string;
        regexps: (RegExp | string)[];
    };
}

export interface ResponseMatchRegExpArray extends Response {
    responseType: MatchRegExpArrayResponseType;
    data: MatchRegExpArrayResult;
}

export function isMatchRegExpArrayRequest(v: unknown): v is RequestMatchRegExpArray {
    return isRequestType(v, requestTypeMatchRegExpArray);
}
export function isMatchRegExpArrayResponse(v: unknown): v is ResponseMatchRegExpArray {
    return isResponseType(v, requestTypeMatchRegExpArray);
}

export function procMatchRegExpArray(r: RequestMatchRegExpArray): ResponseMatchRegExpArray | ErrorResponse;
export function procMatchRegExpArray(r: Request): undefined | ResponseMatchRegExpArray | ErrorResponse;
export function procMatchRegExpArray(r: RequestMatchRegExpArray | Request): ResponseMatchRegExpArray | ErrorResponse | undefined {
    if (!isMatchRegExpArrayRequest(r)) return undefined;
    try {
        const regex = r.data.regexps.map((r) => toRegExp(r));
        const regexResult = matchRegExpArray(r.data.text, regex);

        return createResponseMatchRegExpArray(r, regexResult);
    } catch (e) {
        return createErrorResponse(r, format(e));
    }
}

export function createRequestMatchRegExpArray(data: RequestMatchRegExpArray['data']): RequestMatchRegExpArray {
    return createRequest(requestTypeMatchRegExpArray, data);
}

export function createResponseMatchRegExpArray(
    request: RequestMatchRegExpArray,
    data: ResponseMatchRegExpArray['data'],
): ResponseMatchRegExpArray {
    return createResponse(request.id, request.requestType, data);
}
