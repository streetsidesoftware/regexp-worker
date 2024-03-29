import { format } from 'util';
import { matchRegExp, MatchRegExpResult, toRegExp } from '../helpers/evaluateRegExp';
import {
    createErrorResponse,
    createRequest,
    createResponse,
    ErrorResponse,
    genIsRequest,
    genIsResponse,
    Request,
    Response,
} from './procedure';

export const requestTypeMatchRegExp = 'MatchRegExp';
export type MatchRegExpRequestType = typeof requestTypeMatchRegExp;
export type MatchRegExpResponseType = MatchRegExpRequestType;

export interface RequestMatchRegExp extends Request {
    requestType: MatchRegExpRequestType;
    data: {
        text: string;
        regexp: RegExp | string;
    };
}

export interface ResponseMatchRegExp extends Response {
    responseType: MatchRegExpRequestType;
    data: MatchRegExpResult;
}

export const isMatchRegExpRequest = genIsRequest<RequestMatchRegExp>(requestTypeMatchRegExp);
export const isMatchRegExpResponse = genIsResponse<ResponseMatchRegExp>(requestTypeMatchRegExp);

export function procMatchRegExp(r: RequestMatchRegExp): ResponseMatchRegExp | ErrorResponse;
export function procMatchRegExp(r: Request): Response | undefined;
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
