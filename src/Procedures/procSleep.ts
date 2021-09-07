import {
    Request,
    Response,
    genIsRequest,
    genIsResponse,
    createErrorResponse,
    ErrorResponse,
    createRequest,
    createResponse,
} from './procedure';

export type SleepRequestType = 'Sleep';
export type SleepResponseType = SleepRequestType;
export const typeSleep: SleepRequestType = 'Sleep';

export interface RequestSleep extends Request {
    requestType: SleepRequestType;
    data: {
        durationMs: number;
    };
}

export interface ResponseSleep extends Response {
    responseType: SleepRequestType;
    data: {
        durationMs: number;
    };
}

export const isSleepRequest = genIsRequest<RequestSleep>(typeSleep);
export const isSleepResponse = genIsResponse<ResponseSleep>(typeSleep);

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
