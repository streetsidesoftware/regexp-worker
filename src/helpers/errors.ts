function getTypeOf(t: unknown) {
    return typeof t;
}
type TypeOfTypes = ReturnType<typeof getTypeOf>;

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
    if (!e || typeof e !== 'object') return false;
    const ex = <Error>e;
    return (
        typeof ex.name == 'string' &&
        typeof ex.message == 'string' &&
        typeof ex.stack in allowStringOrUndefined
    );
}
