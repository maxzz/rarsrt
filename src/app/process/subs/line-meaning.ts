import chalk from 'chalk';
import { EOL } from 'os';

// fix counter utilities

export const enum LineType {
    counter,
    stamp,
    empty, // empty line
    text, // anything else
}

export type SingleLineMeaning = {
    type: LineType;
    line: string;
};

export type LineMeaning = {
    type: LineType;
    line: string | string[];
};

export const regFirstLine = new RegExp(`(WEBVTT\s*(FILE)?.*)(${EOL})*`, 'g');
const extraMarkup = /^Kind:|^Language:/;
const regCcCounter = /^\s*\d{1,5}\s*$/g;
export const reg2ItemsLine = /(\d{2}:\d{2})[\.,](\d{3}\s+)-->(\s+\d{2}:\d{2})[\.,](\d{3}\s*)/g;
export const reg3ItemsLine = /(\d{2}:\d{2}:\d{2})[\.,](\d{3}\s+)-->(\s+\d{2}:\d{2}:\d{2})[\.,](\d{3}\s*)/g;

export function getLinesMeaning(lines: string[]): SingleLineMeaning[] {
    function getLineMeaning(line: string): SingleLineMeaning {
        line = line.trim();
        const type =
            line === ''
                ? LineType.empty
                : line.match(regCcCounter)
                    ? LineType.counter
                    : line.match(reg2ItemsLine) || line.match(reg3ItemsLine)
                        ? LineType.stamp
                        : line.match(extraMarkup)
                            ? LineType.empty
                            : LineType.text;
        return { type, line };
    }
    return lines.map(getLineMeaning);
}

export function splitLineMeaningsToGroups(lines: SingleLineMeaning[]): LineMeaning[][] {
    const rvGroups: LineMeaning[][] = [];

    let idx = lines[0]?.line.match(regFirstLine) ? 1 : 0; // skip 'WEBVTT'
    let current: LineMeaning[] = [];

    for (; idx < lines.length;) {
        const line = lines[idx];

        if (line.type !== LineType.text) {
            if (line.type !== LineType.empty) { // empty lines before the first timestamp
                current.push(line);
            }
        } else {
            const consecutive: LineMeaning[] = [line];

            while (idx++ < lines.length) { // collect following text and empty lines
                const next = lines[idx];
                const isConsecutive = next && (next.type === LineType.text || next.type === LineType.empty);
                if (isConsecutive) {
                    consecutive.push(next);
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
                current.push({ type: LineType.text, line: consecutive.map(({ line }) => line as string) });
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

function printLineMeanings(lineMeaning: LineMeaning[]) {
    lineMeaning.forEach(({ line, type }) => {
        const prefix =
            type === LineType.counter
                ? chalk.cyan('numbr')
                : type === LineType.stamp
                    ? chalk.yellow('stamp')
                    : type === LineType.empty
                        ? '     '
                        : type === LineType.text
                            ? chalk.gray(' text')
                            : chalk.red('?');
                            
        const txt = typeof line === 'string' ? line : `\n${line.join(EOL)}`;
        console.log(`${prefix}: ${txt}`);
    });
}

export function printLineMeaningsGroups(lineMeaning: LineMeaning[][]) {
    lineMeaning.forEach((group) => {
        console.log(chalk.green('start:'));
        printLineMeanings(group);
    });
}
