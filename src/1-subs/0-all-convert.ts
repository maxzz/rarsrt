import { EOL } from "os";
import { type SingleLineCnt, type LinesGroup } from "./9-types";
import { processLineGroups } from "./1-process-line-groups";
import { getLinesMeaning } from "./6-get-lines-meaning";
import { makeLineGroups } from "./7-make-line-groups";

type ConvertSubtitlesParams = {
    fileContent: string;    // The file content to be processed.
    doSrt: boolean;         // The processed file content has the extension ".srt".
};

export type ConvertSubtitlesResult = {
    newContent: string;     // The processed file content.
    hasFixes: boolean;      // TODO: To check if the file has any changes. so far it's always true.
};

export function convertSubtitles({ fileContent, doSrt }: ConvertSubtitlesParams): ConvertSubtitlesResult {
    const fileLines = fileContent.split(/\r?\n/);
    const singleLineCnts: SingleLineCnt[] = getLinesMeaning(fileLines);
    const lineGroups: LinesGroup[] = makeLineGroups(singleLineCnts);

    const newGroups = processLineGroups({ lineGroups, doSrt });
    const newContent = combineLineGroups(newGroups);

    return {
        newContent,
        hasFixes: true,
    };
}

function combineLineGroups(linesGroups: LinesGroup[]) {
    const newContent =
        linesGroups
            .map(
                (linesGroup) => linesGroup.map(
                    ({ lineMulti }) => typeof lineMulti === 'string' ? lineMulti : lineMulti.join(EOL)
                ).join(EOL)
            )
            .join(EOL);

    return newContent;
}
