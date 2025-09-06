export function removeIndent(src: string, all?: boolean): string {
    // 1. if defined all then remove all indentation from each line
    if (all) {
        return src.replace(/^[^\S\n]+/gm, '');
    }
    // 2. remove the shortest leading indentation from each line
    const match = src.match(/^[^\S\n]*(?=\S)/gm);
    match && !match[0] && match.shift(); // remove the first line if empty
    const indent = match && Math.min(...match.map(line => line.length));
    if (indent) {
        const regexp = new RegExp(`^.{${indent}}`, 'gm');
        return src.replace(regexp, '');
    }
    return src;
}
