import type { MatchAllToRangesRegExpResult } from '../helpers/evaluateRegExp.js';
import { matchAllToRangesRegExp, toRegExp } from '../helpers/evaluateRegExp.js';
import type { RegExpLike } from '../helpers/regexp.js';
import { format } from '../util/format.js';
import type { ErrorResponse, Request, Response } from './procedure.js';
import { createErrorResponse, createRequest, createResponse, isRequestType, isResponseType } from './procedure.js';

export const requestTypeMatchAllRegExpAsRange = 'MatchAllRegExpAsRange';
export type MatchAllRegExpAsRangeRequestType = typeof requestTypeMatchAllRegExpAsRange;
export type MatchAllRegExpAsRangeResponseType = MatchAllRegExpAsRangeRequestType;

export interface RequestMatchAllRegExpAsRangeData {
    text: string;
    regexp: RegExpLike;
}

export type RequestMatchAllRegExpAsRange = Request<MatchAllRegExpAsRangeRequestType, RequestMatchAllRegExpAsRangeData>;
export type ResponseMatchAllRegExpAsRange = Response<MatchAllRegExpAsRangeResponseType, MatchAllToRangesRegExpResult>;

export function isMatchAllRegExpAsRangeRequest(v: unknown): v is RequestMatchAllRegExpAsRange {
    return isRequestType(v, requestTypeMatchAllRegExpAsRange);
}
export function isMatchAllRegExpAsRangeResponse(v: unknown): v is ResponseMatchAllRegExpAsRange {
    return isResponseType(v, requestTypeMatchAllRegExpAsRange);
}

export function procMatchAllRegExpAsRange(
    r: RequestMatchAllRegExpAsRange,
): ResponseMatchAllRegExpAsRange | ErrorResponse<MatchAllRegExpAsRangeResponseType>;
export function procMatchAllRegExpAsRange(
    r: Request,
): ResponseMatchAllRegExpAsRange | ErrorResponse<MatchAllRegExpAsRangeResponseType> | undefined;
export function procMatchAllRegExpAsRange(
    r: RequestMatchAllRegExpAsRange | Request,
): ResponseMatchAllRegExpAsRange | ErrorResponse | undefined {
    if (!isMatchAllRegExpAsRangeRequest(r)) return undefined;
    try {
        const regex = toRegExp(r.data.regexp);
        const regexResult = matchAllToRangesRegExp(r.data.text, regex);

        return createResponseMatchAllRegExpAsRange(r, regexResult);
    } catch (e) {
        return createErrorResponse(r, format(e));
    }
}

export function createRequestMatchAllRegExpAsRange(data: RequestMatchAllRegExpAsRange['data']): RequestMatchAllRegExpAsRange {
    return createRequest(requestTypeMatchAllRegExpAsRange, data);
}

export function createResponseMatchAllRegExpAsRange(
    request: RequestMatchAllRegExpAsRange,
    data: ResponseMatchAllRegExpAsRange['data'],
): ResponseMatchAllRegExpAsRange {
    return createResponse(request.id, request.requestType, data);
}
