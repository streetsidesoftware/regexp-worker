import * as regexpTree from 'regexp-tree';
import type { AstRegExp } from 'regexp-tree/ast';

export type AST = AstRegExp;

interface Loc {
    start: { offset: number; line: number; column: number };
    end: { offset: number; line: number; column: number };
}

interface WithLocation {
    type: string;
    name?: string;
    value?: string;
    loc?: Loc;
}

export type NodeEntry = [id: number, start: number, end: number, type: string, value: string | undefined, depth: number | undefined];

export interface ParsedEntry {
    id: number;
    start: number;
    end: number;
    type: string;
    text: string;
    value?: string;
    depth?: number;
}

export const iId = 0;
export const iStart = 1;
export const iEnd = 2;
export const iType = 3;
export const iValue = 4;
export const iDepth = 5;

const regExpComment = /#.*$/gm; // Matches comments in regular expressions

export function parseRegExp(source: string, flags: string): ParsedEntry[] {
    const isXMode = flags.includes('x');
    const regexp = isXMode ? `/\n${source}\n/${flags}` : `/${source}/${flags}`;
    const adjOffset = isXMode ? 2 : 1; // Adjust offset for x mode

    const ast = regexpTree.parse(regexp, { captureLocations: true, allowGroupNameDuplicates: true });

    const entries: NodeEntry[] = [];
    let idCounter = 0;

    regexpTree.traverse(ast, {
        '*': (node) => {
            const n = node.node as WithLocation;
            if (n.loc && n.type) {
                entries.push([idCounter++, n.loc.start.offset - adjOffset, n.loc.end.offset - adjOffset, n.type, n.value ?? n.name, 0]);
            }
            // console.log(`Node type: ${n.type}, Start: ${n.loc?.start.offset}, End: ${n.loc?.end.offset}`, n);
            return true; // Continue traversing
        }
    });

    return joinEntries(segmentEntries(entries).filter((e) => e[iStart] >= 0 && e[iEnd] > e[iStart] && e[iType] !== 'RegExp'));

    function getText(entry: NodeEntry): string {
        return source.slice(entry[iStart], entry[iEnd]);
    }

    function segmentEntries(entries: NodeEntry[]): NodeEntry[] {
        const stack: NodeEntry[] = [];
        const collection: NodeEntry[] = [];
        let iGroupDepth = 0;

        for (const entry of entries) {
            let parent = stack[stack.length - 1];
            while (parent && entry[iStart] >= parent[iEnd]) {
                pushEntry(parent);
                iGroupDepth = parent[iDepth] || 0;
                stack.pop();
                parent = stack[stack.length - 1];
            }
            if (parent) {
                if (parent[iStart] < entry[iStart]) {
                    const p: NodeEntry = [...parent];
                    p[iEnd] = entry[iStart];
                    pushEntry(p);
                }
                parent[iStart] = entry[iEnd];
            }
            entry[iDepth] = iGroupDepth; // Set depth
            if (entry[iType] === 'Group') {
                iGroupDepth++;
            }
            stack.push(entry);
        }

        for (let parent = stack.pop(); parent; parent = stack.pop()) {
            pushEntry(parent);
        }
        return collection;

        function pushEntry(entry: NodeEntry) {
            if (entry[iType] === 'Char' || !isXMode) {
                collection.push(entry);
                return;
            }
            const iOffset = entry[iStart];
            const text = getText(entry);
            for (const match of text.matchAll(regExpComment)) {
                let commentStart = iOffset + match.index!;
                let commentEnd = commentStart + match[0].length;
                const e: NodeEntry = [...entry];
                e[iEnd] = commentStart;
                collection.push(e);
                collection.push([idCounter++, commentStart, commentEnd, 'Comment', match[0], entry[iDepth]]);

                const r = /(?:\r?\n)+/y
                r.lastIndex = commentEnd - iOffset;
                const newLineMatch = text.match(r);
                if (newLineMatch) {
                    commentStart = commentEnd;
                    commentEnd += newLineMatch[0].length;
                    collection.push([idCounter++, commentStart, commentEnd, 'Text', newLineMatch[0], entry[iDepth]]);
                }

                entry[iStart] = commentEnd; // Update start to after the comm
            }
            if (entry[iStart] < entry[iEnd]) {
                collection.push(entry);
            }
        }
    }

    function toParsedEntry(entry: NodeEntry): ParsedEntry {
        return {
            id: entry[iId],
            start: entry[iStart],
            end: entry[iEnd],
            text: getText(entry),
            type: entry[iType],
            value: entry[iValue],
            depth: entry[iDepth]
        };
    }

    function joinEntries(entries: NodeEntry[]): ParsedEntry[] {
        const joined: NodeEntry[] = [];
        let current: NodeEntry | undefined = undefined;
        let lastPos = 0;

        for (const entry of entries) {
            if (current?.[iType] === entry[iType] && current[iEnd] === entry[iStart]) {
                if (current[iType] === 'Char' && !current[iValue]?.startsWith('\\') && !entry[iValue]?.startsWith('\\')) {
                    lastPos = current[iEnd] = entry[iEnd];
                    current[iValue] += entry[iValue] || '';
                    continue;
                }
            }
            if (entry[iStart] > lastPos) {
                joined.push([idCounter++, lastPos, entry[iStart], 'Text', undefined, 0]);
            }
            lastPos = entry[iEnd];
            joined.push(entry);
            current = entry;
        }
        return joined.map(toParsedEntry);
    }
}
