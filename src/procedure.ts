/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

export type RequestType = string;
export type ResponseType = RequestType;

export interface Request {
    id: number;
    requestType: RequestType;
    data: any;
}

export interface Response {
    id: number;
    responseType: ResponseType;
    data: any;
}

export function genIsRequest<T extends Request>(key: T['requestType']): (v: any) => v is T {
    return  (v: any): v is T => {
        return isRequest(v) && v.requestType === key;
    }
}

export function isRequest(v: any): v is Request {
    return !!(typeof v === 'object' && typeof (v as Request).requestType === 'string' && (typeof v.id === 'number'));
}

export function genIsResponse<T extends Response>(key: T['responseType']): (v: any) => v is T {
    return  (v: any): v is T => {
        return isResponse(v) && v.responseType === key;
    }
}

export function isResponse(v: any): v is Response {
    return !!(typeof v === 'object' && typeof (v as Response).responseType === 'string' && (typeof v.id === 'number'));
}

export function createRequest<T extends Request>(id: number, requestType: T['requestType'], data: T['data']): T {
    return { id, requestType, data } as T;
}

export function createResponse<T extends Response>(id: number, responseType: T['responseType'], data: T['data']): T {
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
            id: request?.id || 0,
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
