import { EOL } from "os";
import { type LineMeaning } from "./9-types";
import { processWithGroups } from "./1-lines";

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
    const newGroups = processWithGroups({ fileLines, doSrt });
    const newContent = combineLineMeaningGroups(newGroups);

    return {
        newContent,
        hasFixes: true,
    };
}

function combineLineMeaningGroups(lineMeaning: LineMeaning[][]) {
    const newContent = lineMeaning.map(
        (group) => group.map(
            ({ lineMulti: line }) => typeof line === 'string' ? line : line.join(EOL)
        ).join(EOL)
    ).join(EOL);

    return newContent;
}
