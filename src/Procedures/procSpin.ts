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
import { hrTimeToMs } from '../timer';

export type SpinRequestType = 'Spin';
export type SpinResponseType = SpinRequestType;
export const typeSpin: SpinRequestType = 'Spin';

export interface RequestSpin extends Request {
    requestType: SpinRequestType;
    data: {
        durationMs: number;
    };
}

export interface ResponseSpin extends Response {
    responseType: SpinRequestType;
    data: {
        elapsedTimeMs: number;
        count: number;
    };
}

export const isSpinRequest = genIsRequest<RequestSpin>(typeSpin);
export const isSpinResponse = genIsResponse<ResponseSpin>(typeSpin);

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
        const startTime = process.hrtime();
        while ((elapsedTimeMs = hrTimeToMs(process.hrtime(startTime))) < durationMs) {
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
