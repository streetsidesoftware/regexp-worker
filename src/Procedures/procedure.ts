import { type UniqueID, createId, isId, NullID } from './uniqueId.js';

export type RequestType = string;
export type ResponseType = RequestType;

export interface Request {
    id: UniqueID;
    requestType: RequestType;
    data: any;
}

export interface Response {
    id: UniqueID;
    timestamp: number;
    responseType: ResponseType;
    data: any;
}

export function genIsRequest<T extends Request>(key: T['requestType']): (v: any) => v is T {
    return (v: any): v is T => {
        return isRequest(v) && v.requestType === key;
    };
}

export function isRequest(v: any): v is Request {
    return !!(typeof v === 'object' && typeof (v as Request).requestType === 'string' && isId(v.id));
}

export function genIsResponse<T extends Response>(key: T['responseType']): (v: any) => v is T {
    return (v: any): v is T => {
        return isResponse(v) && v.responseType === key;
    };
}

export function isResponse(v: any): v is Response {
    return !!(typeof v === 'object' && typeof (v as Response).responseType === 'string' && isId(v.id));
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

export function createErrorResponse(request: Request | any, message: string, error?: Error): ErrorResponse {
    if (!isRequest(request)) {
        return createResponse(request?.id || NullID, responseTypeError, { requestType: request?.requestType, message, error });
    }

    const { id, requestType } = request;
    return createResponse(id, responseTypeError, { requestType, message, error });
}

export const isErrorResponse = genIsResponse<ErrorResponse>(responseTypeError);
