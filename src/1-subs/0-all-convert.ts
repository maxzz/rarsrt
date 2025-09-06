import { EOL } from "os";
import { type SingleLineMeaning, type LinesGroup } from "./9-types";
import { processLineGroups } from "./1-process-line-groups";
import { getLinesMeaning } from "./6-get-lines-meaning";
import { splitToLineGroups } from "./7-split-to-line-groups";

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
    const linesMeaning: SingleLineMeaning[] = getLinesMeaning(fileLines);
    const lineGroups: LinesGroup[] = splitToLineGroups(linesMeaning);

    const newGroups = processLineGroups({ lineGroups, doSrt });

    const newContent = combineLineMeaningGroups(newGroups);

    return {
        newContent,
        hasFixes: true,
    };
}

function combineLineMeaningGroups(lineMeaning: LinesGroup[]) {
    const newContent = lineMeaning.map(
        (group) => group.map(
            ({ lineMulti: line }) => typeof line === 'string' ? line : line.join(EOL)
        ).join(EOL)
    ).join(EOL);

    return newContent;
}
