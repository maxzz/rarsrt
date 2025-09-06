import { EOL } from "os";
import { LineType, type LineMeaning, type SingleLineMeaning } from "./9-types";

// fix counter utilities

const regFirstLine = new RegExp(`(WEBVTT\s*(FILE)?.*)(${EOL})*`, 'g');

export function splitLineMeaningsToGroups(lines: SingleLineMeaning[]): LineMeaning[][] {
    const rvGroups: LineMeaning[][] = [];

    let idx = lines[0]?.line.match(regFirstLine) ? 1 : 0; // skip 'WEBVTT'
    let current: LineMeaning[] = [];

    for (; idx < lines.length;) {
        const line = lines[idx];

        if (line.type !== LineType.text) {
            if (line.type !== LineType.empty) { // empty lines before the first timestamp
                current.push({ type: line.type, lineMulti: line.line });
            }
        } else {
            const consecutive: LineMeaning[] = [{ type: line.type, lineMulti: line.line }];

            while (idx++ < lines.length) { // collect following text and empty lines
                const next = lines[idx];
                const isConsecutive = next && (next.type === LineType.text || next.type === LineType.empty);
                if (isConsecutive) {
                    consecutive.push({ type: next.type, lineMulti: next.line });
                } else {
                    idx--;
                    break;
                }
            }

            let last: LineMeaning;
            while ((last = consecutive[consecutive.length - 1]) && last.type === LineType.empty) {
                consecutive.pop();
            }

            if (consecutive.length > 1) {
                current.push({ type: LineType.text, lineMulti: consecutive.map(({ lineMulti: line }) => line as string) });
            } else if (consecutive.length) {
                current.push(...consecutive);
            }

            if (current.length) {
                rvGroups.push(current);
                current = [];
            }
        }

        idx++;
    }

    if (current.length) {
        rvGroups.push(current);
    }

    return rvGroups;
}

export function combineLineMeaningGroups(lineMeaning: LineMeaning[][]) {
    const newContent = lineMeaning.map(
        (group) => group.map(
            ({ lineMulti: line }) => typeof line === 'string' ? line : line.join(EOL)
        ).join(EOL)
    ).join(EOL);

    return newContent;
}
