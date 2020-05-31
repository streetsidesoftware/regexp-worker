import { Request, Response, genIsRequest, genIsResponse, ErrorResponse, createRequest, } from './procedure';

export type GenErrorRequestType = 'GenError';
export type GenErrorResponseType = GenErrorRequestType;
export const typeGenError: GenErrorRequestType = 'GenError';

export type ErrorMethods = 'Throw' | 'undefined' | 'Non-response' | 'reject'
export interface RequestGenError extends Request {
    requestType: GenErrorRequestType;
    data: ErrorMethods;
}

export interface ResponseGenError extends Response {
    responseType: GenErrorRequestType;
    data: any;
}

const undefinedResponse: any = undefined;

export const isGenErrorRequest = genIsRequest<RequestGenError>(typeGenError);
export const isGenErrorResponse = genIsResponse<ResponseGenError>(typeGenError);

export function procGenError(r: RequestGenError): ResponseGenError | ErrorResponse;
export function procGenError(r: Request): undefined;
export function procGenError(r: RequestGenError | Request): Promise<ResponseGenError>  | ResponseGenError | ErrorResponse | undefined {
    if (!isGenErrorRequest(r)) return undefined;
    switch (r.data) {
        case 'Throw': throw new Error('Error Thrown');
        case 'undefined': return Promise.resolve(undefinedResponse);
        case 'reject': return Promise.reject(new Error('Reject'));
    }
}

export function createRequestGenError(data: RequestGenError['data']): RequestGenError {
    return createRequest(typeGenError, data);
}
