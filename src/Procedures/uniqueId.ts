
let id = process.hrtime()[0];

export type ID = string;

/**
 * Gets a unique ID for each call.
 * Note: a UUID would be the "correct" solution, but this will work for our purposes.
 * Give that, this is more complex than it needs to be.
 */
export function createId(): ID {
    ++id;
    const t = process.hrtime();
    const v = id ^ t[0] ^ t[1];
    const a = ('0' + v % 13).slice(-2);
    const b = v;
    const c = id;
    const d = (c + b) % 7
    return `ID-${a}-${b}-${c}-${d}` ;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function isId(value: any): value is ID {
    if (typeof value === 'string' && /^ID-\d+-\d+-\d+-\d+$/.test(value)) {
        const [a, b, c, d] = value.split('-').slice(1).map(v => Number.parseInt(v, 10));
        return a === b % 13 && d === (b + c) % 7;
    }
    return false;
}

export const NullID = 'ID-0-0-0-0'
