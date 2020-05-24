/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ID, createId, isId, NullID } from './uniqueId';

export type RequestType = string;
export type ResponseType = RequestType;

export interface Request {
    id: ID;
    requestType: RequestType;
    data: any;
}

export interface Response {
    id: ID;
    responseType: ResponseType;
    data: any;
}

export function genIsRequest<T extends Request>(key: T['requestType']): (v: any) => v is T {
    return  (v: any): v is T => {
        return isRequest(v) && v.requestType === key;
    }
}

export function isRequest(v: any): v is Request {
    return !!(typeof v === 'object' && typeof (v as Request).requestType === 'string' && isId(v.id));
}

export function genIsResponse<T extends Response>(key: T['responseType']): (v: any) => v is T {
    return  (v: any): v is T => {
        return isResponse(v) && v.responseType === key;
    }
}

export function isResponse(v: any): v is Response {
    return !!(typeof v === 'object' && typeof (v as Response).responseType === 'string' && isId(v.id));
}

export function createRequest<T extends Request>(requestType: T['requestType'], data: T['data']): T {
    return { id: createId(), requestType, data } as T;
}

export function createResponse<T extends Response>(id: ID, responseType: T['responseType'], data: T['data']): T {
    return { id, responseType, data } as T;
}

export interface ErrorData {
    requestType: RequestType | undefined;
    message: string;
}

export interface ErrorResponse extends Response {
    responseType: 'Error',
    data: ErrorData;
}

export const responseTypeError: ErrorResponse['responseType'] = 'Error';


export function createErrorResponse(request: Request | any, message: string): ErrorResponse {
    if (!isRequest(request)) {
        return {
            id: request?.id || NullID,
            responseType: responseTypeError,
            data: {
                requestType: request?.requestType,
                message
            }
        }
    }

    const { id, requestType } = request;
    return {
        id,
        responseType: responseTypeError,
        data: {
            requestType,
            message
        }
    }
}

export const isErrorResponse = genIsResponse<ErrorResponse>(responseTypeError);
