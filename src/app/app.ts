import path from 'path';
import fs from 'fs';
import rimraf from 'rimraf';
import { notes } from './app-notes';
import { ffmpegUtils } from '../utils/utils-ffmpeg';
import { LineAnimation } from './app-messages';
import { getAppOptions } from './app-arguments';
import { checkMaxLength, checkSubtitlesFormat, getMSPairs, MSPair } from './process';

function oneFileAction(lineAnimation: LineAnimation, targetFolder: string, shortMp4: string, shortSrt: string, final: MSPair[]) {
    const mp4 = path.join(targetFolder, `${shortMp4}`);
    const srt = path.join(targetFolder, `${shortSrt}`);
    const out = path.join(targetFolder, `temp-tm-temp.mp4`);

    const options = getAppOptions();
    checkMaxLength(targetFolder, srt, final);
    checkSubtitlesFormat(srt, options);

    lineAnimation.writeStateLine(shortMp4);
    const result = ffmpegUtils.createFileMp4WithSrt(mp4, srt, out); //TODO: try/catch to clean up 'temp-tm-temp.mp4' in case of exception

    if (!result.skipped) {
        rimraf.sync(mp4);
        fs.renameSync(out, mp4);
        !options.preserve && rimraf.sync(srt); // remove it as the last, in case if mp4 is locked by player.
    }
}

function handleFolder(targetFolder: string) {
    // 0. Collect names with .mp4 and .srt combine them into pairs and merge.
    const lineAnimation = new LineAnimation();

    let lastFolder = path.basename(targetFolder) || targetFolder;

    let final: MSPair[] = getMSPairs(targetFolder);

    final.forEach(({ mp4, srt }) => oneFileAction(lineAnimation, targetFolder, mp4, srt, final));
    lineAnimation.cleanStateLine();

    notes.addProcessed(`    ${final.length ? ` (${final.length})`.padStart(7, ' ') : 'skipped'}: ${lastFolder}`);
}

export function handleFolders(dirs: string[]) {
    for (let dir of dirs) {
        handleFolder(dir);
    }
}
