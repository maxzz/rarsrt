import { EOL } from 'os';

export const enum ConvertAction {
    convert,    // convert hh:mm:ss.ms to hh:mm:ss,ms fix hh, and extra conter
    fix,        // keep vtt, but fix mm:ss.ms to hh:mm:ss.ms, and extra conter
}

export type ConvertResult = {
    newContent: string;
    hasFixes: boolean;
};

type Context = {
    ccCount: number;
    hasFixes: boolean;  // file has default hour timestamps (i.e. mm:ss,ms wo/ hh:)
    action: ConvertAction;
};

const regFirstLine = new RegExp(`(WEBVTT\s*(FILE)?.*)(${EOL})*`, 'g');
const regCcCounter = /^\s*\d{1,5}\s*$/g;
const reg2ItemsLine = /(\d{2}:\d{2})\.(\d{3}\s+)-->(\s+\d{2}:\d{2})\.(\d{3}\s*)/g;
const reg3ItemsLine = /(\d{2}:\d{2}:\d{2})\.(\d{3}\s+)-->(\s+\d{2}:\d{2}:\d{2})\.(\d{3}\s*)/g;

function convertTimestamp(item: string, context: Context): string {
    (context.action === ConvertAction.convert) && (item = item.replace('.', ',')); // '00:05.130 ' -> '00:05,130 ' || ' 00:10.350' -> ' 00:10,350'
    if (item.split(":").length < 3) {
        context.hasFixes = true;
        item = '00:' + item.trim(); // '00:00:05,130' || '00:00:10,350'
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

/*
Bad format (lines 2 and 6 should not be in vtt):
0:'WEBVTT'
1:''
2:'0'
3:'00:00:05.381 --> 00:00:10.340'
4:'In this lesson, we will look at the main string data type in Unreal Engine - FString,'
5:''
6:'1'
7:'00:00:10.340 --> 00:00:15.000'
8:'but before we start, let's create our own logging category.'
9:''
length:10
*/
function removeVttCounters(lines: string[]): string[] {
    const enum LineType {
        counter,
        stamp,
        text, // anything else
    }

    type LineMeaning = {
        type: LineType;
        line: string;
    };

    function getLineMeaning(line: string): LineMeaning {
        const type = line.match(regCcCounter) ? LineType.counter : line.match(reg2ItemsLine) || line.match(reg3ItemsLine) ? LineType.stamp : LineType.text;
        return { type, line };
    }

    const types: LineMeaning[] = lines.map(getLineMeaning);
    const newLines = types.map((type, idx) => {
        const isCounter = type.type === LineType.counter && idx + 1 < types.length && types[idx + 1].type === LineType.stamp;
        return isCounter ? undefined : type;
    }).filter(Boolean).map((type) => type.line);
    
    return newLines;
}

export function convertVttToSrt(fileContent: string, action: ConvertAction): ConvertResult {

    const context: Context = {
        ccCount: 0,
        hasFixes: false,
        action,
    };

    const lines = removeVttCounters(fileContent.split(/\r?\n/));

    const newContent = action === ConvertAction.convert
        ? lines.map((line) => convertLine(line, context)).filter((line) => line !== undefined).join('')
        : lines.map((line) => fixVttLine(line, context)).filter((line) => line !== undefined).join(EOL);

    return {
        newContent,
        hasFixes: context.hasFixes,
    };
}
