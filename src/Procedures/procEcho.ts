import type { ErrorResponse, Request, Response } from './procedure.js';
import { createErrorResponse, createRequest, createResponse, isRequestType, isResponseType } from './procedure.js';

export type EchoRequestType = 'Echo';
export type EchoResponseType = EchoRequestType;
export const typeEcho: EchoRequestType = 'Echo';

export type RequestEchoData = string;
export type ResponseEchoData = RequestEchoData;

export type RequestEcho = Request<EchoRequestType, RequestEchoData>;
export type ResponseEcho = Response<EchoResponseType, ResponseEchoData>;

export function isEchoRequest(v: unknown): v is RequestEcho {
    return isRequestType(v, typeEcho);
}

export function isEchoResponse(v: unknown): v is ResponseEcho {
    return isResponseType(v, typeEcho);
}

export function procEcho(r: RequestEcho): ResponseEcho | ErrorResponse;
export function procEcho(r: Request): undefined;
export function procEcho(r: RequestEcho | Request): ResponseEcho | ErrorResponse | undefined {
    if (!isEchoRequest(r)) return undefined;
    if (typeof r.data !== 'string') {
        return createErrorResponse(r, 'Empty Echo');
    }
    return createResponseEcho(r, r.data);
}

export function createRequestEcho(data: RequestEcho['data']): RequestEcho {
    return createRequest(typeEcho, data);
}

export function createResponseEcho(request: RequestEcho, data: ResponseEcho['data']): ResponseEcho {
    return createResponse(request.id, request.requestType, data);
}
