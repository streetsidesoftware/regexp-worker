import { Request, Response, genIsRequest, genIsResponse, createErrorResponse, ErrorResponse, createRequest, createResponse } from './procedure';

export type EchoRequestType = 'Echo';
export type EchoResponseType = EchoRequestType;
export const typeEcho: EchoRequestType = 'Echo';

export interface RequestEcho extends Request {
    requestType: EchoRequestType;
    data: string;
}

export interface ResponseEcho extends Response {
    responseType: EchoRequestType;
    data: string;
}

export const isEchoRequest = genIsRequest<RequestEcho>(typeEcho);
export const isEchoResponse = genIsResponse<ResponseEcho>(typeEcho);

export function procEcho(r: RequestEcho): ResponseEcho | ErrorResponse;
export function procEcho(r: Request): undefined;
export function procEcho(r: RequestEcho | Request): ResponseEcho | ErrorResponse | undefined {
    if (!isEchoRequest(r)) return undefined;
    if (!r.data) {
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
