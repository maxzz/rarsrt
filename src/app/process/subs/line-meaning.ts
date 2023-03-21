import chalk from 'chalk';
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
    line: string | string[];
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

export function splitLineMeaningsToGroups(lines: LineMeaning[]) {
    const groups: LineMeaning[][] = [];
    let current: LineMeaning[] = [];

    lines.forEach((line) => {
        current.push(line);

        if (line.type === LineType.text) {
            if (current.length) {
                groups.push(current);
            }
            current = [];
        }
    });

    if (current.length) {
        groups.push(current);
    }

    return groups;
}

export function printLineMeanings(lines: LineMeaning[]) {
    lines.forEach(({ line, type }) => {
        const s = type === LineType.counter ? chalk.cyan('numbr') : type === LineType.stamp ? chalk.yellow('stamp') : type === LineType.empty ? '     ' : type === LineType.text ? chalk.gray(' text') : chalk.red('?');
        console.log(`${s}: ${line}`);
    });
}

export function printLineMeaningsGroups(lines: LineMeaning[][]) {
    lines.forEach((group) => {
        console.log(chalk.green('start:'));
        printLineMeanings(group);
    });
}

export function printDebugLineMeanings(linesMeaning: LineMeaning[]) {
    const doGroups = true;
    const doAll = false;
    
    if (doGroups) {
        const groups = splitLineMeaningsToGroups(linesMeaning);
        printLineMeaningsGroups(groups);
        process.exit(0);
    }

    if (doAll) {
        printLineMeanings(linesMeaning);
        process.exit(0);
    }
}

function fixSrtGroup(group: LineMeaning[]): [stamp: LineMeaning, text: LineMeaning] | undefined {
    // 1. remove the previous counter(s) and set our own counter, starting at 1 if format .srt (not .vtt)
    // 2. remove any empty lines

    type GroupItem = {
        stamp?: LineMeaning;
        text?: LineMeaning;
    };

    const items = group.reduce<GroupItem>((acc, cur) => {
        (cur.type === LineType.stamp) && (acc.stamp = cur);
        (cur.type === LineType.text) && (acc.text = cur);
        return acc;
    }, {});

    const rv: LineMeaning[] = [];

    //rv.push({ type: LineType.counter, line: `${idx + 1}` });

    if (items.stamp && items.text) {
        return [items.stamp, items.text];
    }
}

export function processWithGroups(fileLines: string[]) {
    
    const linesMeaning = getLinesMeaning(fileLines);
    const groups = splitLineMeaningsToGroups(linesMeaning);

    const fixedGroups = groups.map(fixSrtGroup).filter(Boolean);
    
    const isSrt = true;
    
    const newGroups = fixedGroups.map((group, idx) => {
        if (!group) {
            console.log(chalk.red('empty group'));
        }
        const newGroup: LineMeaning[] = [];
        if (isSrt) {
            newGroup.push({ type: LineType.counter, line: `${idx + 1}` });
        }
        newGroup.push(...group);
        return newGroup;
    });
    
    //printLineMeaningsGroups(groups);
    printLineMeaningsGroups(newGroups);
}
