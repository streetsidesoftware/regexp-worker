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
    const index = indices[0]?.[0] || 0;
    const result: RegExpMatchArray = [''];
    result.input = input;
    result.index = index;
    result.indices = indices;
    // The TypeScript lib types leave out the `undefined` values that unmatched groups produce.
    const uResult: (string | undefined)[] & { groups?: Record<string, string | undefined> } = result;

    for (let i = 0; i < indices.length; i++) {
        if (!indices[i]) {
            // If the indices are empty, we set the result to undefined
            uResult[i] = undefined;
            continue;
        }
        const [start, end] = indices[i] ?? [];
        result[i] = input.slice(start, end);
    }

    // A named group that does not participate in the match has `undefined` indices,
    // even though the TypeScript lib types it as `[number, number]`.
    const groupIndices: Record<string, [number, number] | undefined> | undefined = indices.groups;
    if (groupIndices) {
        uResult.groups = toGroups(input, groupIndices);
    }

    return result;
}

function toGroups(input: string, groupIndices: Record<string, [number, number] | undefined>): Record<string, string | undefined> {
    // Native matches give `groups` a null prototype.
    const groups = Object.create(null) as Record<string, string | undefined>;
    for (const [key, range] of Object.entries(groupIndices)) {
        groups[key] = range && input.slice(range[0], range[1]);
    }
    return groups;
}

/**
 * Gives a match's `groups` and `indices.groups` back the null prototype that native matches have.
 * Sending a match from the worker copies these objects, and the copies have `Object.prototype`.
 */
export function restoreMatchPrototypes(match: RegExpMatchArray): void {
    restoreGroupsPrototype(match);
    if (match.indices) {
        restoreGroupsPrototype(match.indices);
    }
}

/**
 * Gives `groups` back the null prototype that native matches have.
 * Sending a match from the worker copies `groups`, and the copy has `Object.prototype`.
 */
export function restoreGroupsPrototype(match: { groups?: object | undefined }): void {
    if (match.groups) {
        match.groups = Object.assign(Object.create(null) as object, match.groups);
    }
}
