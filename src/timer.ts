interface MeasureResult<T> {
    elapsedTimeMs: number;
    r: T;
}

export function measureExecution<T>(fn: () => T): MeasureResult<T> {
    const start = performance.now();
    const r = fn();
    const elapsedTimeMs = performance.now() - start;
    return {
        elapsedTimeMs,
        r,
    };
}

export function elapsedTimeMsFrom(relativeTo: number): number {
    return performance.now() - relativeTo;
}

export async function measurePromise<T>(fn: () => Promise<T> | T): Promise<MeasureResult<T>> {
    const start = performance.now();
    const r = await fn();
    const elapsedTimeMs = performance.now() - start;
    return {
        elapsedTimeMs,
        r,
    };
}
