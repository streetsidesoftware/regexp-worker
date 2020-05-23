
export function measureExecution<T>(fn: () => T): { elapsedTimeMs: number; r: T } {
    const start = process.hrtime();
    const r = fn();
    const elapsedTimeMs = hrTimeToMs(process.hrtime(start));
    return {
        elapsedTimeMs,
        r
    }
}

export function hrTimeToMs(hrTime: [number, number]): number {
    return hrTime[0] * 1.0e-3 + hrTime[1] * 1.0e-6
}
