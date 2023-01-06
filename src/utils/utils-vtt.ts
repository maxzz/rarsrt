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
const reg2ItemsLine = /(\d{2}:\d{2})[\.,](\d{3}\s+)-->(\s+\d{2}:\d{2})[\.,](\d{3}\s*)/g;
const reg3ItemsLine = /(\d{2}:\d{2}:\d{2})[\.,](\d{3}\s+)-->(\s+\d{2}:\d{2}:\d{2})[\.,](\d{3}\s*)/g;

// fix counter utilities

const enum LineType {
    counter,
    stamp,
    empty, // empty line
    text, // anything else
}

type LineMeaning = {
    type: LineType;
    line: string;
};

function getLinesMeaning(lines: string[]): LineMeaning[] {
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

// convert utilities

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
function removeVttCounters(lines: string[], context: Context): string[] {
    const types: LineMeaning[] = getLinesMeaning(lines);
    const newLines = types.map((type, idx) => {
        const isCounter = type.type === LineType.counter
            && types[idx + 1].type === LineType.stamp;

        isCounter && (context.hasFixes = true);
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

    const lines = removeVttCounters(fileContent.split(/\r?\n/), context);

    const newContent = action === ConvertAction.convert
        ? lines.map((line) => convertLine(line, context)).filter((line) => line !== undefined).join('')
        : lines.map((line) => fixVttLine(line, context)).filter((line) => line !== undefined).join(EOL);

    return {
        newContent,
        hasFixes: context.hasFixes,
    };
}

/*
Bad format (lines 0 and 4 should not be in srt):
0:'0'
1:'1'
2:'00:00:01,280 --> 00:00:08,450'
3:'Hello and welcome to this section on prepositions. Prepositions are these kind of small words that'
4:'1'
5:'2'
6:'00:00:08,450 --> 00:00:16,640'
7:'go before nouns and show the relationship between the noun and the rest of the sentence. There are'
*/
/*
Bad format (between line 4 and 6 is empty line):
0:{type: 0, line: '0'}
1:{type: 0, line: '1'}
2:{type: 1, line: '00:00:01,280 --> 00:00:08,450'}
3:{type: 3, line: 'Hello and welcome to this section on prepositi…epositions are these kind of small words that'}
4:{type: 0, line: '1'}
5:{type: 2, line: ''}
6:{type: 0, line: '2'}
7:{type: 1, line: '00:00:08,450 --> 00:00:16,640'}
8:{type: 3, line: 'go before nouns and show the relationship betw… noun and the rest of the sentence. There are'}
*/
function removeSrtCounters(lines: string[], context: Context): string[] {
    const types: LineMeaning[] = getLinesMeaning(lines);
    const newLines = types.map((type, idx) => {
        // const isCounter = type.type === LineType.counter
        //     && types[idx + 1].type === LineType.counter
        //     && types[idx + 2].type === LineType.stamp;
        const isCounter = (
            type.type === LineType.counter
            && types[idx + 1].type === LineType.counter
            && types[idx + 2].type === LineType.stamp
        ) || (
            type.type === LineType.counter
            && types[idx + 1].type === LineType.empty
            && types[idx + 2].type === LineType.counter
            && types[idx + 3].type === LineType.stamp
        );

        isCounter && (context.hasFixes = true);
        return isCounter ? undefined : type;
    }).filter(Boolean).map((type) => type.line);

    return newLines;
}

export function fixSrt(fileContent: string): ConvertResult {
    const context: Context = {
        ccCount: 0,
        hasFixes: false,
        action: ConvertAction.fix,
    };

    const lines = removeSrtCounters(fileContent.split(/\r?\n/), context);

    const newContent = lines.map((line) => fixVttLine(line, context)).filter((line) => line !== undefined).join(EOL);

    return {
        newContent,
        hasFixes: context.hasFixes,
    };
}