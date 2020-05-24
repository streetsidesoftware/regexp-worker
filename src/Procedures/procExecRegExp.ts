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
import { ExecRegExpResult, execRegExp, toRegExp } from '../helpers/evaluateRegExp';

export type ExecRegExpRequestType = 'ExecRegExp';
export type ExecRegExpResponseType = ExecRegExpRequestType;
export const requestTypeExecRegExp: ExecRegExpRequestType = 'ExecRegExp';

export interface RequestExecRegExp extends Request {
    requestType: ExecRegExpRequestType;
    data: {
        text: string;
        regexp: RegExp | string;
    };
}

export interface ResponseExecRegExp extends Response {
    responseType: ExecRegExpRequestType;
    data: ExecRegExpResult;
}

export const isExecRegExpRequest = genIsRequest<RequestExecRegExp>(requestTypeExecRegExp);
export const isExecRegExpResponse = genIsResponse<ResponseExecRegExp>(requestTypeExecRegExp);

export function procExecRegExp(r: RequestExecRegExp): ResponseExecRegExp | ErrorResponse;
export function procExecRegExp(r: Request): undefined;
export function procExecRegExp(r: RequestExecRegExp | Request): ResponseExecRegExp | ErrorResponse | undefined {
    if (!isExecRegExpRequest(r)) return undefined;
    try {
        const regex = toRegExp(r.data.regexp);
        return createResponseExecRegExp(r, execRegExp(regex, r.data.text));
    } catch (e) {
        return createErrorResponse(r, e.toString());
    }
}

export function createRequestExecRegExp(data: RequestExecRegExp['data']): RequestExecRegExp {
    return createRequest(requestTypeExecRegExp, data);
}

export function createResponseExecRegExp(request: RequestExecRegExp, data: ResponseExecRegExp['data']): ResponseExecRegExp {
    return createResponse(request.id, request.requestType, data);
}
