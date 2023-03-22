import { ConvertResult } from './types';
import { combineLineMeaningGroups } from './line-meaning';
import { processWithGroups } from './lines';
export * from './types';

export function convertSubtitles({ fileContent, doSrt }: { fileContent: string, doSrt: boolean; }): ConvertResult {
    const fileLines = fileContent.split(/\r?\n/);
    const newGroups = processWithGroups({ fileLines, doSrt });
    const newContent = combineLineMeaningGroups(newGroups);

    return {
        newContent,
        hasFixes: true,
    };
}
