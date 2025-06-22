export function format(value: unknown): string {
    switch (typeof value) {
        case 'bigint':
            return value.toString() + 'n'; // Append 'n' to indicate bigint
        case 'symbol':
            return value.toString(); // Symbols are not directly convertible to string
        case 'function':
            return value.name ? `Function: ${value.name}` : 'Function';
        case 'undefined':
            return 'undefined';
        case 'object':
            return objToString(value); // Handle objects, arrays, and null
        case 'string':
            return value; // Strings are returned as is
    }
    return String(value);
}

function objToString(value: object | null): string {
    try {
        if (value === null) {
            return 'null';
        }
        if (value instanceof Error) {
            return `Error: ${value.message}\nStack: ${value.stack}`;
        }
        if (Array.isArray(value)) {
            return `[${value.map(format).join(', ')}]`;
        }
        if ('toString' in value && typeof value.toString === 'function') {
            return value['toString']();
        }
        return JSON.stringify(value, null, 2);
    } catch {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        return String(value);
    }
}
