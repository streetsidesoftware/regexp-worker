import { toError } from '../helpers/errors.js';
import { type UniqueID, createId, isId, NullID } from './uniqueId.js';

export type RequestType = string;
export type ResponseType = RequestType;

export interface Request<T = unknown> {
    id: UniqueID;
    requestType: RequestType;
    data: T;
}

export interface Response<T = unknown> {
    id: UniqueID;
    timestamp: number;
    responseType: ResponseType;
    data: T;
}

export function isRequestType<T extends Request>(v: unknown, requestType: T['requestType']): v is T {
    return isRequest(v) && v.requestType === requestType;
}

export function isRequest(v: unknown): v is Request {
    if (!v || typeof v !== 'object') return false;
    const r = v as Request;
    return typeof r.requestType === 'string' && isId(r.id);
}

export function isResponseType<T extends Response>(v: unknown, responseType: T['responseType']): v is T {
    return isResponse(v) && v.responseType === responseType;
}

export function isResponse(v: unknown): v is Response {
    if (!v || typeof v !== 'object') return false;
    const r = v as Response;
    return typeof r.responseType === 'string' && isId(r.id);
}

export function createRequest<T extends Request>(requestType: T['requestType'], data: T['data']): T {
    return { id: createId(), requestType, data } as T;
}

export function createResponse<T extends Response>(id: UniqueID, responseType: T['responseType'], data: T['data']): T {
    return { id, timestamp: Date.now(), responseType, data } as T;
}

export interface ErrorData {
    requestType: RequestType | undefined;
    message: string;
    error: Error | undefined;
}

export interface ErrorResponse extends Response {
    responseType: 'Error';
    data: ErrorData;
}

export const responseTypeError: ErrorResponse['responseType'] = 'Error';

export function createErrorResponse(request: Request | unknown, message: string, error?: Error | unknown): ErrorResponse {
    if (!isRequest(request)) {
        const r = (request && typeof request === 'object' ? request : {}) as Request;
        const id = isId(r.id) ? r.id : NullID;
        return createResponse(id, responseTypeError, {
            requestType: typeof r.requestType === 'string' ? r.requestType : undefined,
            message,
            error: toError(error),
        });
    }

    const { id, requestType } = request;
    return createResponse(id, responseTypeError, { requestType, message, error: toError(error) });
}

export function isErrorResponse(v: unknown): v is ErrorResponse {
    return isResponseType(v, responseTypeError);
}
