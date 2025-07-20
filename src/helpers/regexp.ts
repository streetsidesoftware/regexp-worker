export type RegExpOrString = RegExp | string;

/**
 * Represents a regular expression-like object that has `source` and `flags` properties.
 */
export interface RegExpLike {
    source: string;
    flags: string;
    lastIndex?: number | undefined;
}

export function isRegExp(r: unknown): r is RegExp {
    return r instanceof RegExp;
}

export function isRegExpLike(r: unknown): r is RegExpLike {
    if (r instanceof RegExp) return true;
    if (r && typeof r === 'object' && 'source' in r && 'flags' in r && typeof r.source === 'string' && typeof r.flags === 'string')
        return true;
    return false;
}

/**
 * Converts a RegExp, RegExpLike object, or string to a RegExp object.
 * If the input is a string, it can be in the format `/pattern/flags`.
 * If the input is a RegExpLike object, it should have `source` and `flags` properties.
 * If the input is a RegExp, it is returned as is.
 * The `x` flag is removed and the source is normalized to remove comments and whitespace.
 * @param r
 * @param defaultFlags
 * @returns
 */
export function toRegExp(r: RegExp | RegExpLike | string, defaultFlags?: string): RegExp {
    if (r instanceof RegExp) return r;

    r = typeof r === 'string' ? stringToRegExpLike(r, defaultFlags) : r;

    if (isRegExpLike(r)) {
        const { source, flags } = normalizeRegExp(r);
        const reg = new RegExp(source, flags);
        if (r.lastIndex !== undefined) {
            reg.lastIndex = r.lastIndex;
        }
        return reg;
    }
    throw new TypeError('Invalid RegExp or string.');
}

/**
 * Removes the `x` flag from a regular expression if it exists.
 * The `x` flag is used for extended mode, which allows whitespace and comments in the
 * regular expression pattern. This function is useful to ensure that the regular expression
 * can be safely used in contexts where the `x` flag is not supported or desired.
 * @param regex
 * @returns
 */
export function normalizeRegExp(regex: RegExpLike): RegExpLike {
    if (regex instanceof RegExp) return regex;
    let { source, flags } = regex;
    if (!flags.includes('x')) {
        return regex;
    }

    flags = flags.replace('x', '');
    source = source.replace(/#.*$/gm, ''); // Remove comments
    source = source.replace(/\s+/g, ''); // Remove whitespace

    const r: RegExpLike = { source, flags };
    if (regex.lastIndex !== undefined) {
        r.lastIndex = regex.lastIndex;
    }

    return r;
}

// cspell:ignore dgimsuvyx
const regExpIsRegExpLike = /^\/(.*)\/([dgimsuvyx]*)$/;

export function stringToRegExpLike(str: string, defaultFlags?: string): RegExpLike {
    const match = str.match(regExpIsRegExpLike);
    if (match) {
        return { source: match[1], flags: match[2] || defaultFlags || '' };
    }
    return { source: str, flags: '' };
}

export function regExpIndicesToRegExpMatchArray(input: string, indices: RegExpIndicesArray): RegExpMatchArray {
    const index = indices[0][0];
    const result: RegExpMatchArray = [''];
    result.input = input;
    result.index = index;
    result.indices = indices;
    const uResult: (string | undefined)[] = result;

    for (let i = 0; i < indices.length; i++) {
        if (!indices[i]) {
            // If the indices are empty, we set the result to undefined
            uResult[i] = undefined;
            continue;
        }
        const [start, end] = indices[i];
        result[i] = input.slice(start, end);
    }

    const groups = indices.groups
        ? Object.fromEntries(Object.entries(indices.groups).map(([key, [start, end]]) => [key, input.slice(start, end)]))
        : undefined;

    if (groups) {
        result.groups = groups;
    }

    return result;
}
