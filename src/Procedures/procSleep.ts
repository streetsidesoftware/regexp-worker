import type { ErrorResponse, Request, Response } from './procedure.js';
import { createErrorResponse, createRequest, createResponse, isRequestType, isResponseType } from './procedure.js';

export type SleepRequestType = 'Sleep';
export type SleepResponseType = SleepRequestType;
export const typeSleep: SleepRequestType = 'Sleep';

export interface SleepRequestData {
    durationMs: number;
}

export type RequestSleep = Request<SleepRequestType, SleepRequestData>;
export type ResponseSleep = Response<SleepResponseType, SleepRequestData>;

export function isSleepRequest(v: unknown): v is RequestSleep {
    return isRequestType(v, typeSleep);
}
export function isSleepResponse(v: unknown): v is ResponseSleep {
    return isResponseType(v, typeSleep);
}

export function procSleep(r: RequestSleep): Promise<ResponseSleep | ErrorResponse>;
export function procSleep(r: Request): undefined;
export function procSleep(r: RequestSleep | Request): Promise<ResponseSleep | ErrorResponse> | undefined {
    if (!isSleepRequest(r)) return undefined;
    if (!isValid(r)) {
        return Promise.resolve(createErrorResponse(r, 'Empty Sleep Duration'));
    }
    return new Promise((resolve) => {
        const response = createResponseSleep(r, r.data);
        setTimeout(() => resolve(response), r.data.durationMs);
    });
}

export function createRequestSleep(data: RequestSleep['data'] | number): RequestSleep {
    data = typeof data === 'number' ? { durationMs: data } : data;
    return createRequest(typeSleep, data);
}

export function createResponseSleep(request: RequestSleep, data: ResponseSleep['data']): ResponseSleep {
    return createResponse(request.id, request.requestType, data);
}

function isValid(request: RequestSleep): boolean {
    return !!(request.data && typeof request.data.durationMs === 'number');
}
