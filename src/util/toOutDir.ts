import * as Path from 'path';

const outDir = 'lib';

export function toOutDir(filename: string): string {
    if (!filename || !Path.basename(filename) || /\bsrc$/.test(filename)) return filename.replace(/\bsrc$/, outDir);
    return Path.join(
        toOutDir(Path.dirname(filename)),
        Path.basename(filename)
    );
}
