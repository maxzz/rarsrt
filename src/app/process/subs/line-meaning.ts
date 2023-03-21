import { EOL } from 'os';

// fix counter utilities

export const enum LineType {
    counter,
    stamp,
    empty, // empty line
    text, // anything else
}

export type LineMeaning = {
    type: LineType;
    line: string;
};

export const regFirstLine = new RegExp(`(WEBVTT\s*(FILE)?.*)(${EOL})*`, 'g');
const regCcCounter = /^\s*\d{1,5}\s*$/g;
export const reg2ItemsLine = /(\d{2}:\d{2})[\.,](\d{3}\s+)-->(\s+\d{2}:\d{2})[\.,](\d{3}\s*)/g;
export const reg3ItemsLine = /(\d{2}:\d{2}:\d{2})[\.,](\d{3}\s+)-->(\s+\d{2}:\d{2}:\d{2})[\.,](\d{3}\s*)/g;

export function getLinesMeaning(lines: string[]): LineMeaning[] {
    function getLineMeaning(line: string): LineMeaning {
        line = line.trim();
        const type =
            line === ''
                ? LineType.empty
                : line.match(regCcCounter)
                    ? LineType.counter
                    : line.match(reg2ItemsLine) || line.match(reg3ItemsLine)
                        ? LineType.stamp
                        : LineType.text;
        return { type, line };
    }
    return lines.map(getLineMeaning);
}

export function printLineMeanings(lines: LineMeaning[]) {
    lines.forEach(({ line, type }) => {
        const s = type === LineType.counter ? '🎫n' : type === LineType.stamp ? '⏱s' : type === LineType.empty ? ' ' : type === LineType.text ? '📃t' : '🏀?'; //📀♦
        console.log(`${s}: ${line}`);
    });
}