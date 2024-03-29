import chalk from 'chalk';
import { getLinesMeaning, SingleLineMeaning, LineType, LineMeaning, splitLineMeaningsToGroups, printLineMeaningsGroups } from "./line-meaning";

const enum ConvertAction {
    convertToSrt,   // convert hh:mm:ss.ms to hh:mm:ss,ms fix hh, and extra conter
    fixAndKeepVtt,  // keep vtt, but fix mm:ss.ms to hh:mm:ss.ms, and extra conter
}

type Context = {
    ccCount: number;
    hasFixes: boolean;  // file has default hour timestamps (i.e. mm:ss,ms wo/ hh:)
    action: ConvertAction;
};

function convertTimestamp(timestampStr: string, context: Context): string {
    if (context.action === ConvertAction.convertToSrt) {
        timestampStr = timestampStr.replace('.', ','); // '00:05.130 '(vtt) -> '00:05,130 '(srt)
    }

    if (timestampStr.split(":").length < 3) {
        context.hasFixes = true;
        timestampStr = '00:' + timestampStr.trim(); // (srt/vtt): '00:05,130' -> '00:00:10,350'
    }

    return timestampStr;
}

export function processWithGroups({ fileLines, doSrt }: { fileLines: string[], doSrt: boolean; }): LineMeaning[][] {
    const linesMeaning: SingleLineMeaning[] = getLinesMeaning(fileLines);
    const groups: LineMeaning[][] = splitLineMeaningsToGroups(linesMeaning);
    const counterlessGroups = groups.map(removeEmptyAndCounter).filter(Boolean);

    const context: Context = {
        ccCount: 0,
        hasFixes: false,
        action: doSrt ? ConvertAction.convertToSrt : ConvertAction.fixAndKeepVtt,
    };

    const emptyLine: LineMeaning = { type: LineType.empty, line: '' };

    const newGroups = counterlessGroups.map(([stampLine, textLine], idx) => {
        correctTimestamp(stampLine);

        const newGroup: LineMeaning[] = [stampLine, textLine, emptyLine];
        if (doSrt) {
            newGroup.unshift({ type: LineType.counter, line: `${idx + 1}` });
        }
        return newGroup;
    });

    if (!doSrt) {
        newGroups.unshift([{ type: LineType.text, line: 'WEBVTT' }, emptyLine]);
    }

    //printLineMeaningsGroups(newGroups);

    return newGroups;

    function correctTimestamp(stamp: SingleLineMeaning) {
        stamp.line = stamp.line.split('-->').map((leftAndRight) => convertTimestamp(leftAndRight, context)).join(' --> ');
    }

    function removeEmptyAndCounter(group: SingleLineMeaning[]): [stamp: SingleLineMeaning, text: SingleLineMeaning] | undefined {
        // 0. remove the previous counter(s) and remove any empty lines

        type GroupItem = {
            stamp?: SingleLineMeaning;
            text?: SingleLineMeaning;
        };

        const items = group.reduce<GroupItem>((acc, cur) => {
            (cur.type === LineType.stamp) && (acc.stamp = cur);
            (cur.type === LineType.text) && (acc.text = cur);
            return acc;
        }, {});

        if (items.stamp && items.text) {
            return [items.stamp, items.text];
        }

        console.log(chalk.red('Empty group:', JSON.stringify(group)));
    }
}
