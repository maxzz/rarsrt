import chalk from 'chalk';
import { EOL } from 'os';
import { getLinesMeaning, SingleLineMeaning, LineType, LineMeaning, reg2ItemsLine, reg3ItemsLine, regFirstLine, splitLineMeaningsToGroups } from "./line-meaning";
import { ConvertAction } from './types';

export type Context = {
    ccCount: number;
    hasFixes: boolean;  // file has default hour timestamps (i.e. mm:ss,ms wo/ hh:)
    action: ConvertAction;
};

// convert utilities

function convertTimestamp(item: string, context: Context): string {
    if (context.action === ConvertAction.convert) {
        item = item.replace('.', ','); // '00:05.130 ' -> '00:05,130 ' || ' 00:10.350' -> ' 00:10,350'
    }
    
    if (item.split(":").length < 3) {
        context.hasFixes = true;
        item = '00:' + item.trim(); // '00:00:05,130' || '00:00:10,350'
    }

    return item;
}

export function convertVttLine(line: string, context: Context): string | undefined {

    if (!line.trim()) {
        return;
    }

    let vttLine = '';

    if (line.match(reg2ItemsLine)) {
        const vttComp = line.split('-->');
        vttLine = vttComp.map((part) => convertTimestamp(part, context)).join(' --> ');
        vttLine = vttLine + EOL;
    }
    else if (line.match(reg3ItemsLine)) {
        const vttComp = line.split('-->');
        vttLine = vttComp.map((part) => convertTimestamp(part, context)).join(' --> ');
        vttLine = EOL + vttLine + EOL;
    }
    else if (line.match(regFirstLine)) {
        vttLine = line.replace(regFirstLine, '');
    }
    else {
        vttLine = line + EOL;
    }

    if (!vttLine.trim()) {
        return;
    }

    if (/^Kind:|^Language:/m.test(vttLine)) {
        return;
    }

    if (/^[0-9]+:/m.test(vttLine)) {
        if (context.ccCount === 0) {
            vttLine = ++context.ccCount + EOL + vttLine; // '1\r\n00:00:05,130 --> 00:00:10,350\r\n'
        } else {
            vttLine = EOL + ++context.ccCount + EOL + vttLine;
        }
    }
    return vttLine;
}

export function fixVttLine(line: string, context: Context): string {
    if (!line.trim()) {
        return line;
    }

    let vttLine = line;

    if (line.match(reg2ItemsLine)) {
        const vttComp = line.split('-->');
        vttLine = vttComp.map((part) => convertTimestamp(part, context)).join(' --> ');
    }

    return vttLine;
}



function removeEmptyAndCounter(group: SingleLineMeaning[]): [stamp: SingleLineMeaning, text: SingleLineMeaning] | undefined {
    // 1. remove the previous counter(s) and set our own counter, starting at 1 if format .srt (not .vtt)
    // 2. remove any empty lines

    type GroupItem = {
        stamp?: SingleLineMeaning;
        text?: SingleLineMeaning;
    };

    const items = group.reduce<GroupItem>((acc, cur) => {
        (cur.type === LineType.stamp) && (acc.stamp = cur);
        (cur.type === LineType.text) && (acc.text = cur);
        return acc;
    }, {});

    const rv: SingleLineMeaning[] = [];

    //rv.push({ type: LineType.counter, line: `${idx + 1}` });

    if (items.stamp && items.text) {
        return [items.stamp, items.text];
    }
}

export function processWithGroups({ fileLines, doSrt }: { fileLines: string[], doSrt: boolean; }): LineMeaning[][] {
    const linesMeaning: SingleLineMeaning[] = getLinesMeaning(fileLines);
    const groups: LineMeaning[][] = splitLineMeaningsToGroups(linesMeaning);
    const counterlessGroups = groups.map(removeEmptyAndCounter);

    const newGroups = counterlessGroups.map((group, idx) => {
        if (!group) {
            console.log(chalk.red('empty group'));
        }

        const newGroup: LineMeaning[] = [];
        if (doSrt) {
            newGroup.push({ type: LineType.counter, line: `${idx + 1}` });
        }
        newGroup.push(...group);

        return newGroup;
    });

    const rv = newGroups.map(removeEmptyAndCounter).filter(Boolean);
    return rv;
}
