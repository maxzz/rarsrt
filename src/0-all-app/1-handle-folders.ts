import path from 'path';
import fs from 'fs';
import rimraf from 'rimraf';
import { ffmpegUtils, LineAnimation, notes } from '../utils';
import { checkFilenameMaxLen, getAppOptions, preprocessSubtitlesFileFormat } from '../5-args';
import { type MSPair, getMSPairs } from '../5-args';

export function handleFolders(dirs: string[]) {
    for (let dir of dirs) {
        handleFolder(dir);
    }
}

function handleFolder(targetFolder: string) {
    // 0. Collect names with .mp4 and .srt combine them into pairs and merge.
    const animation = new LineAnimation();
    const lastFolder = path.basename(targetFolder) || targetFolder;
    const allPairs: MSPair[] = getMSPairs(targetFolder);

    allPairs.forEach(({ mp4, srt }) => {
        oneFileAction(animation, targetFolder, mp4, srt, allPairs);
    });

    animation.cleanStateLine();

    notes.addProcessed(`    ${allPairs.length ? ` (${allPairs.length})`.padStart(7, ' ') : 'skipped'}: ${lastFolder}`);
}

function oneFileAction(animation: LineAnimation, targetFolder: string, shortMp4: string, shortSrt: string, final: MSPair[]) {
    const mp4FullFname = path.join(targetFolder, shortMp4);
    const srtFullFname = path.join(targetFolder, shortSrt);
    const outFullFname = path.join(targetFolder, `temp-tm-temp.mp4`);

    const appOptions = getAppOptions();

    checkFilenameMaxLen(targetFolder, srtFullFname, final);
    preprocessSubtitlesFileFormat(srtFullFname, appOptions);

    animation.writeStateLine(shortMp4);
    
    const result = ffmpegUtils.createFileMp4WithSrt(mp4FullFname, srtFullFname, outFullFname); //TODO: try/catch to clean up 'temp-tm-temp.mp4' in case of exception

    if (!result.skipped) {
        rimraf.sync(mp4FullFname);

        fs.renameSync(outFullFname, mp4FullFname);
        !appOptions.preserve && rimraf.sync(srtFullFname); // remove it as the last, in case if mp4 is locked by player.
    }
}
