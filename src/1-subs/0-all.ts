import { combineLineMeaningGroups } from "./2-line-meaning";
import { processWithGroups } from "./3-lines";

export type ConvertResult = {
    newContent: string;
    hasFixes: boolean;
};

export function convertSubtitles({ fileContent, doSrt }: { fileContent: string, doSrt: boolean; }): ConvertResult {
    const fileLines = fileContent.split(/\r?\n/);
    const newGroups = processWithGroups({ fileLines, doSrt });
    const newContent = combineLineMeaningGroups(newGroups);

    return {
        newContent,
        hasFixes: true,
    };
}
