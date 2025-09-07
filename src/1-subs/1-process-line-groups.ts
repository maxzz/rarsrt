import chalk from "chalk";
import { type LinesGroup, type LineCnt, LineTypes } from "./9-types";
import { printLineGroups } from "./8-print-line-groups";

export function processLineGroups({ lineGroups, doSrt }: { lineGroups: LinesGroup[], doSrt: boolean; }): LinesGroup[] {
    const context: Context = {
        hasFixes: false, // TODO: return this value to the caller.
        action: doSrt ? ConvertAction.convertToSrt : ConvertAction.fixAndKeepVtt,
        ccCount: 0,
    };

    const counterlessGroups = lineGroups.map(removeEmptyAndCounter).filter(Boolean);

    const newGroups = counterlessGroups.map(
        ([stampLine, textLine], idx) => {
            correctTimestamp(stampLine, context);

            const newGroup: LinesGroup = [stampLine, textLine, emptyLine];
            if (doSrt) {
                newGroup.unshift({ type: LineTypes.counter, lineMulti: `${idx + 1}` });
            }
            return newGroup;
        }
    );

    if (!doSrt) {
        newGroups.unshift([{ type: LineTypes.text, lineMulti: 'WEBVTT' }, emptyLine]);
    }

    printLineGroups(newGroups);

    return newGroups;
}

const emptyLine: LineCnt = { type: LineTypes.empty, lineMulti: '' };

function removeEmptyAndCounter(linesGroup: LinesGroup): [stamp: LineCnt, text: LineCnt] | undefined {
    // 0. remove the previous counter(s) and remove any empty lines

    type GroupItem = {
        stamp?: LineCnt;
        text?: LineCnt;
    };

    const items = linesGroup.reduce<GroupItem>(
        (acc, cur) => {
            (cur.type === LineTypes.stamp) && (acc.stamp = cur);
            (cur.type === LineTypes.text) && (acc.text = cur);
            return acc;
        }, {}
    );

    if (items.stamp && items.text) {
        return [
            items.stamp,
            items.text,
        ];
    }

    console.log(chalk.red('Empty group:', JSON.stringify(linesGroup)));
}

const enum ConvertAction {
    convertToSrt,   // convert hh:mm:ss.ms to hh:mm:ss,ms fix hh, and extra conter
    fixAndKeepVtt,  // keep vtt, but fix mm:ss.ms to hh:mm:ss.ms, and extra conter
}

type Context = {
    ccCount: number;
    hasFixes: boolean;  // file has default hour timestamps (i.e. mm:ss,ms wo/ hh:)
    action: ConvertAction;
};

function correctTimestamp(stamp: LineCnt, context: Context) {
    stamp.lineMulti = typeof stamp.lineMulti === 'string' ? fixLIne(stamp.lineMulti) : stamp.lineMulti.map(fixLIne);

    function fixLIne(line: string) {
        return line.split('-->')
            .map(
                (leftAndRight) => convertSingleTimestamp(leftAndRight, context)
            )
            .join(' --> ');
    }

}

function convertSingleTimestamp(timestampStr: string, context: Context): string {
    if (context.action === ConvertAction.convertToSrt) {
        timestampStr = timestampStr.replace('.', ','); // '00:05.130 '(vtt) -> '00:05,130 '(srt)
    }

    if (timestampStr.split(":").length < 3) {
        context.hasFixes = true;
        timestampStr = '00:' + timestampStr.trim(); // (srt/vtt): '00:05,130' -> '00:00:10,350'
    }

    return timestampStr;
}
