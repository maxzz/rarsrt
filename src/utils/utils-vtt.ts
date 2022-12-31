import { EOL } from 'os';

type Context = {
    ccCount: number;
    hasFixes: boolean;  // file has default hour timestamps (i.e. mm:ss,ms wo/ hh:)
};

const regFirstLine = new RegExp(`(WEBVTT\s*(FILE)?.*)(${EOL})*`, 'g');
const reg2ItemsLine = /(\d{2}:\d{2})\.(\d{3}\s+)\-\-\>(\s+\d{2}:\d{2})\.(\d{3}\s*)/g;
const reg3ItemsLine = /(\d{2}:\d{2}:\d{2})\.(\d{3}\s+)\-\-\>(\s+\d{2}:\d{2}:\d{2})\.(\d{3}\s*)/g;

function convertTimestamp(item: string, context: Context): string {
    item = item.replace('.', ',');      // '00:05.130 ' -> '00:05,130 ' || ' 00:10.350' -> ' 00:10,350'
    if (item.split(":").length < 3) {
        context.hasFixes = true;
        item = '00:' + item.trim();     // '00:00:05,130' || '00:00:10,350'
    }
    return item;
}

function convertLine(line: string, context: Context): string | undefined {

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

function fixVttLine(line: string, context: Context): string {
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

export type ConvertResult = {
    newContent: string;
    hasFixes: boolean;
};

export const enum ConvertAction {
    convert,
    fix
}

export function convertVttToSrt(fileContent: string, action: ConvertAction): ConvertResult {

    const context: Context = {
        ccCount: 0,
        hasFixes: false,
    };

    const lines = fileContent.split(/\r?\n/);

    const newContent = action === ConvertAction.convert
        ? lines.map((line) => convertLine(line, context)).filter((line) => line !== undefined).join('')
        : lines.map((line) => fixVttLine(line, context)).filter((line) => line !== undefined).join(EOL);

    return {
        newContent,
        hasFixes: context.hasFixes,
    };
}
