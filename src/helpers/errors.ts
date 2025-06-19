function _getTypeOf(t: unknown): string {
    return typeof t;
}

type TypeOfTypes = ReturnType<typeof _getTypeOf>;

type AllowedTypes = Partial<Record<TypeOfTypes, true>>;

const allowStringOrUndefined: AllowedTypes = { string: true, undefined: true };

// const allowNumberOrUndefined: AllowedTypes = {
//     number: true,
//     undefined: true,
// };

export function isError(e: unknown): e is Error {
    if (e instanceof Error) return true;
    if (!e || typeof e !== 'object') return false;
    const ex = <Error>e;
    return typeof ex.name == 'string' && typeof ex.message == 'string' && (typeof ex.stack) in allowStringOrUndefined;
}

export function toError(e: unknown): Error {
    if (e instanceof Error) return e;
    if (isError(e)) {
        return new Error(e.message || 'Unknown error', { cause: e });
    }
    if (typeof e === 'string') return new Error(e);
    return new Error(String(e), { cause: e });
}

/**
 *
 * @param promise A promise that may reject.
 * @returns void
 */
export function catchErrors(promise: Promise<unknown>, onError?: (error: unknown) => void): void {
    promise
        .then(() => {})
        .catch((error) => onError?.(error))
        .catch(() => {});
}

export const __testing__: {
    _getTypeOf: typeof _getTypeOf;
} = { _getTypeOf };
