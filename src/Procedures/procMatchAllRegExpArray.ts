import type { MatchAllRegExpArrayResult } from '../helpers/evaluateRegExp.js';
import { matchAllRegExpArray, toRegExp } from '../helpers/evaluateRegExp.js';
import { format } from '../util/format.js';
import type { ErrorResponse, Request, Response } from './procedure.js';
import { createErrorResponse, createRequest, createResponse, isRequestType, isResponseType } from './procedure.js';

export const requestTypeMatchRegExpArray = 'MatchAllRegExpArray';
export type MatchRegExpArrayRequestType = typeof requestTypeMatchRegExpArray;
export type MatchRegExpArrayResponseType = MatchRegExpArrayRequestType;

export interface RequestMatchRegExpArrayData {
    text: string;
    regexps: RegExp[];
}

export type RequestMatchAllRegExpArray = Request<MatchRegExpArrayRequestType, RequestMatchRegExpArrayData>;
export type ResponseMatchAllRegExpArray = Response<MatchRegExpArrayResponseType, MatchAllRegExpArrayResult>;

export function isMatchRegExpArrayRequest(v: unknown): v is RequestMatchAllRegExpArray {
    return isRequestType(v, requestTypeMatchRegExpArray);
}
export function isMatchRegExpArrayResponse(v: unknown): v is ResponseMatchAllRegExpArray {
    return isResponseType(v, requestTypeMatchRegExpArray);
}

export function procMatchAllRegExpArray(
    r: RequestMatchAllRegExpArray,
): ResponseMatchAllRegExpArray | ErrorResponse<MatchRegExpArrayResponseType>;
export function procMatchAllRegExpArray(r: Request): undefined | ResponseMatchAllRegExpArray | ErrorResponse<MatchRegExpArrayResponseType>;
export function procMatchAllRegExpArray(r: RequestMatchAllRegExpArray | Request): ResponseMatchAllRegExpArray | ErrorResponse | undefined {
    if (!isMatchRegExpArrayRequest(r)) return undefined;
    try {
        const regex = r.data.regexps.map((r) => toRegExp(r));
        const regexResult = matchAllRegExpArray(r.data.text, regex);

        return createResponseMatchRegExpArray(r, regexResult);
    } catch (e) {
        return createErrorResponse(r, format(e));
    }
}

export function createRequestMatchRegExpArray(data: RequestMatchAllRegExpArray['data']): RequestMatchAllRegExpArray {
    return createRequest(requestTypeMatchRegExpArray, data);
}

export function createResponseMatchRegExpArray(
    request: RequestMatchAllRegExpArray,
    data: ResponseMatchAllRegExpArray['data'],
): ResponseMatchAllRegExpArray {
    return createResponse(request.id, request.requestType, data);
}
