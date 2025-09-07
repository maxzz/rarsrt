import { EOL } from "os";
import { LineTypes, type LineCnt, type LinesGroup, type SingleLineCnt } from "./9-types";

/**
 * Split lines into groups to fix counters and remove empty lines.
 */
export function makeLineGroups(lines: SingleLineCnt[]): LinesGroup[] {
    const rvGroups: LinesGroup[] = [];

    let idx = lines[0]?.line.match(regFirstLine) ? 1 : 0; // skip 'WEBVTT'
    let current: LinesGroup = [];

    for (; idx < lines.length;) {
        const line = lines[idx];

        if (line.type !== LineTypes.text) {
            if (line.type !== LineTypes.empty) { // empty lines before the first timestamp
                current.push({ type: line.type, lineMulti: line.line });
            }
        } else {
            const consecutive: LinesGroup = [{ type: line.type, lineMulti: line.line }];

            while (idx++ < lines.length) { // collect following text and empty lines
                const next = lines[idx];
                const isConsecutive = next && (next.type === LineTypes.text || next.type === LineTypes.empty);
                if (isConsecutive) {
                    consecutive.push({ type: next.type, lineMulti: next.line });
                } else {
                    idx--;
                    break;
                }
            }

            let last: LineCnt;
            while ((last = consecutive[consecutive.length - 1]) && last.type === LineTypes.empty) {
                consecutive.pop();
            }

            if (consecutive.length > 1) {
                current.push({ type: LineTypes.text, lineMulti: consecutive.map(({ lineMulti: line }) => line as string) });
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

const regFirstLine = new RegExp(`(WEBVTT\s*(FILE)?.*)(${EOL})*`, 'g');
