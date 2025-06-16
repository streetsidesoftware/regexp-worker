function _getTypeOf(t: unknown) {
    return typeof t;
}

type TypeOfTypes = ReturnType<typeof _getTypeOf>;

type AllowedTypes = Partial<Record<TypeOfTypes, true>>;

const allowStringOrUndefined: AllowedTypes = {
    string: true,
    undefined: true,
};

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

export const __testing__ = {
    _getTypeOf,
};
