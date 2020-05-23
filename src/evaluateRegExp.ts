import { measureExecution } from './timer';

export interface ExecRegExpResult {
    elapsedTimeMs: number;
    matches: RegExpExecArray[];
}

function _execRegExp(regExp: RegExp, text: string): RegExpExecArray[] {
    const re = new RegExp(regExp);

    const results: RegExpExecArray[] = [];
    let lastPos = -1;
    let match;
    let retry = true;
    while (match = re.exec(text)) {
        if (match.index === lastPos) {
            if (!re.global && retry) { break; }
            re.lastIndex = re.lastIndex + 1;
            retry = false;
            continue;
        }
        retry = true;
        lastPos = match.index;
        results.push(match);
    }

    return results;
}

export function execRegExp(regExp: RegExp, text: string): ExecRegExpResult {
    const { elapsedTimeMs, r: matches } = measureExecution(() => _execRegExp(regExp, text));
    return { elapsedTimeMs, matches };
}

export type RegExpOrString = RegExp | string;

export function toRegExp(r: RegExp | string, defaultFlags?: string): RegExp {
    if (isRegExp(r)) return r;

    const match = r.match(/^\/(.*)\/([gimsuy]*)$/);
    if (match) {
        return new RegExp(match[1], match[2] || undefined);
    }
    return new RegExp(r, defaultFlags);
}

export function isRegExp(r: RegExp | any): r is RegExp {
    return r instanceof RegExp;
}
