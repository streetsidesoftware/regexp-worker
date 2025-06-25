export function format(value: unknown): string {
    const visited = new Set<unknown>();

    function _format(value: unknown): string {
        if (visited.has(value)) {
            return '[Circular]'; // Handle circular references
        }
        visited.add(value);
        switch (typeof value) {
            case 'bigint':
                return value.toString() + 'n'; // Append 'n' to indicate bigint
            case 'symbol':
                return value.toString(); // Symbols are not directly convertible to string
            case 'function':
                return value.name ? `[Function: ${value.name}]` : '[Function]';
            case 'undefined':
                return 'undefined';
            case 'object':
                return objToString(value); // Handle objects, arrays, and null
            case 'string':
                return JSON.stringify(value); // Strings are returned as is
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
                return `[${value.map(_format).join(', ')}]`;
            }
            if ('toString' in value && typeof value['toString'] === 'function' && Object.prototype.toString !== value['toString']) {
                return value['toString']();
            }
            const s = Object.entries(value)
                .map(([key, val]) => `${key}: ${_format(val)}`)
                .join(', ');
            return `{${s ? ` ${s} ` : ''}}`;
        } catch (e) {
            return String(e);
        }
    }

    return _format(value);
}
