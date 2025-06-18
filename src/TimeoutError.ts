export class TimeoutError extends Error {
    message: string;
    elapsedTimeMs: number;
    constructor(message: string, elapsedTimeMs: number) {
        super(message);
        this.name = 'TimeoutError';
        this.message = message;
        this.elapsedTimeMs = elapsedTimeMs;
    }
}

export interface TimeoutErrorLike {
    name: string;
    message: string;
    elapsedTimeMs: number;
}

export function isTimeoutErrorLike(e: unknown): e is TimeoutErrorLike {
    if (e instanceof TimeoutError) return true;
    if (!e || typeof e !== 'object') return false;
    const t = e as TimeoutErrorLike;
    return typeof t.message === 'string' && typeof t.elapsedTimeMs === 'number';
}
