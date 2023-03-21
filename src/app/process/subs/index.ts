import { EOL } from 'os';
import { getLinesMeaning, LineMeaning, LineType, printLineMeanings } from './line-meaning';
import { Context, convertLine, fixVttLine } from './lines';
import { ConvertAction, ConvertResult } from './types';
export * from './types';

function removeVttCounters(linesMeaning: LineMeaning[], context: Context): string[] {
    const transformedLines = linesMeaning.map(transformLine);

    const newLines = transformedLines.filter(Boolean).map((type) => type.line); // use Boolean here to skip empty lines
    return newLines;

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
    function transformLine(type: LineMeaning, idx: number, arr: LineMeaning[]): LineMeaning | undefined {
        const isCounter =
            type.type === LineType.counter && arr[idx + 1]?.type === LineType.stamp;

        isCounter && (context.hasFixes = true);
        return isCounter ? undefined : type;
    }
}

function removeSrtDoubleCounters(linesMeaning: LineMeaning[], context: Context): string[] {
    const transformedLines = linesMeaning.map(transformLine);

    const newLines = transformedLines.filter((type) => type !== undefined).map((type) => type.line);
    return newLines;

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
    //const newLines = getLinesMeaning(lines).map(transformLine).filter(Boolean).map((type) => type.type === LineType.counter ? `${EOL}${type.line}` : type.line); //double lines before counter

    function transformLine(type: LineMeaning, idx: number, arr: LineMeaning[]): LineMeaning | undefined {
        const isDoubleCounter =
            type.type === LineType.counter && (
                (
                    arr[idx + 1]?.type === LineType.counter &&  // counter,counter,stamp
                    arr[idx + 2]?.type === LineType.stamp
                ) || (
                    arr[idx + 1]?.type === LineType.empty &&     // counter,empty,counter,stamp
                    arr[idx + 2]?.type === LineType.counter &&
                    arr[idx + 3]?.type === LineType.stamp
                )
            );
        isDoubleCounter && (context.hasFixes = true);
        return isDoubleCounter ? undefined : type;
    }
}

export function convertVttToSrt(fileContent: string, action: ConvertAction): ConvertResult {
    const context: Context = {
        ccCount: 0,
        hasFixes: false,
        action,
    };

    const fileLines = fileContent.split(/\r?\n/);
    const linesMeaning = getLinesMeaning(fileLines);
    printLineMeanings(linesMeaning);
    const fixedLines = removeVttCounters(linesMeaning, context);

    let newContent: string = fileContent;

    if (action === ConvertAction.convert) {
        const newLines = fixedLines.map((line) => convertLine(line, context));

        newContent = newLines.filter((line) => line !== undefined).join('');
    } else if (action === ConvertAction.fix) {
        const newLines = fixedLines.map((line) => fixVttLine(line, context));

        newContent = newLines.filter((line) => line !== undefined).join(EOL);
    }

    return {
        newContent,
        hasFixes: context.hasFixes,
    };
}

export function fixSrt(fileContent: string): ConvertResult {
    const context: Context = {
        ccCount: 0,
        hasFixes: false,
        action: ConvertAction.fix,
    };

    const fileLines = fileContent.split(/\r?\n/);
    const linesMeaning = getLinesMeaning(fileLines);
    printLineMeanings(linesMeaning);
    const fixedLines = removeSrtDoubleCounters(linesMeaning, context);

    const newLines = fixedLines.map((line) => fixVttLine(line, context));

    const newContent = newLines.filter((line) => line !== undefined).join(EOL);

    return {
        newContent,
        hasFixes: context.hasFixes,
    };
}
