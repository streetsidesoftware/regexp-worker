import type { ErrorResponse, Request, Response } from './procedure.js';
import { createErrorResponse, createRequest, createResponse, isRequestType, isResponseType } from './procedure.js';

export type SpinRequestType = 'Spin';
export type SpinResponseType = SpinRequestType;
export const typeSpin: SpinRequestType = 'Spin';

export interface RequestSpinData {
    durationMs: number;
}

export interface SpinResponseData {
    elapsedTimeMs: number;
    count: number;
}

export type RequestSpin = Request<SpinRequestType, RequestSpinData>;
export type ResponseSpin = Response<SpinResponseType, SpinResponseData>;

export function isSpinRequest(v: unknown): v is RequestSpin {
    return isRequestType(v, typeSpin);
}
export function isSpinResponse(v: unknown): v is ResponseSpin {
    return isResponseType(v, typeSpin);
}

export function procSpin(r: RequestSpin): Promise<ResponseSpin | ErrorResponse>;
export function procSpin(r: Request): undefined;
export function procSpin(r: RequestSpin | Request): Promise<ResponseSpin | ErrorResponse> | undefined {
    if (!isSpinRequest(r)) return undefined;
    if (!isValid(r)) {
        return Promise.resolve(createErrorResponse(r, 'Empty Spin Duration'));
    }
    return new Promise((resolve) => {
        const { durationMs } = r.data;
        let elapsedTimeMs = 0;
        let count = 0;
        let n = 0.001;
        const startTime = performance.now();
        while ((elapsedTimeMs = performance.now() - startTime) < durationMs) {
            count++;
            n = Math.sqrt(n) / 2;
        }
        const response = createResponseSpin(r, {
            elapsedTimeMs,
            count,
        });
        resolve(response);
    });
}

export function createRequestSpin(data: RequestSpin['data'] | number): RequestSpin {
    data = typeof data === 'number' ? { durationMs: data } : data;
    return createRequest(typeSpin, data);
}

export function createResponseSpin(request: RequestSpin, data: ResponseSpin['data']): ResponseSpin {
    return createResponse(request.id, request.requestType, data);
}

function isValid(request: RequestSpin): boolean {
    return !!(request.data && typeof request.data.durationMs === 'number');
}
