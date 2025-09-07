import chalk from "chalk";
import { type LinesGroup, type LineCnt, LineTypes } from "./9-types";
import { printLineGroups } from "./8-print-line-groups";

export function processLineGroups({ lineGroups, doSrt }: { lineGroups: LinesGroup[], doSrt: boolean; }): LinesGroup[] {
    const ctx: Ctx = {
        hasFixes: false, // TODO: return this value to the caller.
        action: doSrt ? ConvertAction.convertToSrt : ConvertAction.fixAndKeepVtt,
        ccCount: 0,
    };

    /**
     * ```
     * // counterlessGroups
     * [
     *    {type: 't', lineMulti: '00:00:00,180 --> 00:00:00,510'},
     *    {type: 'l', lineMulti: 'Okay.'}
     * ], [
     *    {type: 't', lineMulti: '00:00:00,510 --> 00:00:05,070'},
     *    {type: 'l', lineMulti: 'So at this point'}
     * ]
    ```
    */
    const counterlessGroups = lineGroups.map(removeEmptyAndCounter).filter(Boolean);

    const newGroups = counterlessGroups.map(
        ([stampLine, textLine], idx) => {
            correctTimestamp(stampLine, ctx);

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

    //printLineGroups(newGroups);

    return newGroups;
}

const emptyLine: LineCnt = { type: LineTypes.empty, lineMulti: '' };

/**
 * @param linesGroup - Group of lines with line numbers.
 * ```
 * [
 *    {type: '#', line: '1'},
 *    {type: 't', line: '00:00:00,180 --> 00:00:00,510'},
 *    {type: 'l', line: 'Okay.'}
 * ]
 * ```
 * @returns - Group of lines without line numbers.
 * ```
 *    [
 *       {type: 't', lineMulti: '00:00:00,180 --> 00:00:00,510'},
 *       {type: 'l', lineMulti: 'Okay.'}
 *    ]
 * 
 *     //This is to fight with:
 *      0
 *      1
 *      00:00:01,280 --> 00:00:08,450
 *      Hello and welcome
 *      1
 *      2
 *      00:00:08,450 --> 00:00:16,640
 *      go before nouns and show
 *      
 *      //And fix as:
 *      1
 *      00:00:01,280  -->  00:00:08,450
 *      Hello and welcome
 *      2
 *      00:00:08,450  -->  00:00:16,640
 *      go before nouns and show
 * ```
 */
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
    convertToSrt,           // convert hh:mm:ss.ms to hh:mm:ss,ms fix hh, and extra conter
    fixAndKeepVtt,          // keep vtt, but fix mm:ss.ms to hh:mm:ss.ms, and extra conter
}

type Ctx = {
    ccCount: number;
    hasFixes: boolean;      // file has default hour timestamps (i.e. mm:ss,ms wo/ hh:)
    action: ConvertAction;
};

/**
 * Convert timestamp to correct format:
 *    * '00:05.130 '(vtt) -> '00:05,130 '(srt)
 *    * (srt/vtt): '00:05,130' -> '00:00:10,350'
 */
function correctTimestamp(stamp: LineCnt, ctx: Ctx): void {
    stamp.lineMulti = typeof stamp.lineMulti === 'string' ? fixLIne(stamp.lineMulti) : stamp.lineMulti.map(fixLIne);

    function fixLIne(line: string) { // TODO: This is applied to stamp line which is single line.
        return line.split('-->')
            .map(
                (leftAndRight) => convertSingleTimestamp(leftAndRight, ctx)
            )
            .join(' --> ');
    }

}

function convertSingleTimestamp(timestampStr: string, ctx: Ctx): string {
    if (ctx.action === ConvertAction.convertToSrt) {
        timestampStr = timestampStr.replace('.', ','); // '00:05.130 '(vtt) -> '00:05,130 '(srt)
    }

    if (timestampStr.split(":").length < 3) {
        ctx.hasFixes = true;
        timestampStr = '00:' + timestampStr.trim(); // (srt/vtt): '00:05,130' -> '00:00:10,350'
    }

    return timestampStr;
}
