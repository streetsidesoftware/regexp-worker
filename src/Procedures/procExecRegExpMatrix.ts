import type { ExecRegExpMatrixResult } from '../helpers/evaluateRegExp.js';
import { execRegExpMatrix } from '../helpers/evaluateRegExp.js';
import type { ErrorResponse, Request, Response } from './procedure.js';
import { createRequest, createResponse, isRequestType, isResponseType } from './procedure.js';

export type ExecRegExpMatrixRequestType = 'ExecRegExpMatrix';
export type ExecRegExpMatrixResponseType = ExecRegExpMatrixRequestType;
export const requestTypeExecRegExpMatrix: ExecRegExpMatrixRequestType = 'ExecRegExpMatrix';

export interface RequestExecRegExpMatrix extends Request {
    requestType: ExecRegExpMatrixRequestType;
    data: {
        textArray: string[];
        regExpArray: RegExp[];
    };
}

export interface ResponseExecRegExpMatrix extends Response {
    responseType: ExecRegExpMatrixRequestType;
    data: ExecRegExpMatrixResult;
}

export function isExecRegExpMatrixRequest(v: unknown): v is RequestExecRegExpMatrix {
    return isRequestType(v, requestTypeExecRegExpMatrix);
}

export function isExecRegExpMatrixResponse(v: unknown): v is ResponseExecRegExpMatrix {
    return isResponseType(v, requestTypeExecRegExpMatrix);
}

export function procExecRegExpMatrix(r: RequestExecRegExpMatrix): ResponseExecRegExpMatrix | ErrorResponse;
export function procExecRegExpMatrix(r: Request): undefined;
export function procExecRegExpMatrix(r: RequestExecRegExpMatrix | Request): ResponseExecRegExpMatrix | ErrorResponse | undefined {
    if (!isExecRegExpMatrixRequest(r)) return undefined;
    const { regExpArray, textArray } = r.data;
    return createResponseExecRegExpMatrix(r, execRegExpMatrix(regExpArray, textArray));
}

export function createRequestExecRegExpMatrix(data: RequestExecRegExpMatrix['data']): RequestExecRegExpMatrix {
    return createRequest(requestTypeExecRegExpMatrix, data);
}

export function createResponseExecRegExpMatrix(
    request: RequestExecRegExpMatrix,
    data: ResponseExecRegExpMatrix['data'],
): ResponseExecRegExpMatrix {
    return createResponse(request.id, request.requestType, data);
}
