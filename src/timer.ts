interface MeasureResult<T> {
    elapsedTimeMs: number;
    r: T;
}

export function measureExecution<T>(fn: () => T): MeasureResult<T> {
    const start = performance.now();
    const r = fn();
    return {
        elapsedTimeMs: performance.now() - start,
        r,
    };
}

export function elapsedTimeMsFrom(relativeTo: number | undefined): number {
    if (!relativeTo) return 0;
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
