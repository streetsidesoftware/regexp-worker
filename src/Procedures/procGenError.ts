import type { ErrorResponse, Request, Response } from './procedure.js';
import { createRequest, isRequestType, isResponseType } from './procedure.js';

export type GenErrorRequestType = 'GenError';
export type GenErrorResponseType = GenErrorRequestType;
export const typeGenError: GenErrorRequestType = 'GenError';

export type ErrorMethods = 'Throw' | 'undefined' | 'Non-response' | 'reject';
export interface RequestGenError extends Request {
    requestType: GenErrorRequestType;
    data: ErrorMethods;
}

export interface ResponseGenError extends Response {
    responseType: GenErrorRequestType;
    data: unknown;
}

export function isGenErrorRequest(v: unknown): v is RequestGenError {
    return isRequestType(v, typeGenError);
}

export function isGenErrorResponse(v: unknown): v is ResponseGenError {
    return isResponseType(v, typeGenError);
}

// @todo: this function signature is most likely wrong.

export function procGenError(r: RequestGenError): ResponseGenError | ErrorResponse;
export function procGenError(r: Request): undefined;
export function procGenError(
    r: RequestGenError | Request,
): Promise<ResponseGenError> | Promise<undefined> | ResponseGenError | ErrorResponse | undefined;
export function procGenError(
    r: RequestGenError | Request,
): Promise<ResponseGenError> | Promise<undefined> | ResponseGenError | ErrorResponse | undefined {
    if (!isGenErrorRequest(r)) return undefined;
    switch (r.data) {
        case 'Throw':
            throw new Error('Error Thrown');
        case 'undefined':
            return Promise.resolve(undefined);
        case 'reject':
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
            return Promise.reject(new Error('Reject')) as Promise<ResponseGenError>;
    }
}

export function createRequestGenError(data: RequestGenError['data']): RequestGenError {
    return createRequest(typeGenError, data);
}
