import path from "path";
import fs from "fs";
import rimraf from "rimraf";
import { exist, ffmpegUtils, LineAnimation, notes, replaceExt } from "../utils";
import { type AppOptions, type MSPair, getAppOptions, getMSPairs } from "../5-args";
import { checkFilenameMaxLen } from "./3-checks";
import { type ConvertSubtitlesResult, convertSubtitles } from "../1-subs";

export function handleFolders(dirs: string[]) {
    for (let dir of dirs) {
        handleFolder(dir);
    }
}

function handleFolder(targetFolder: string): void {
    // 0. Collect names with .mp4 and .srt combine them into pairs and merge.
    const animation = new LineAnimation();
    const lastFolder = path.basename(targetFolder) || targetFolder;
    
    const allPairs: MSPair[] = getMSPairs(targetFolder);

    allPairs.forEach(
        ({ mp4Fname, srtFname }) => {
            oneFileAction(targetFolder, mp4Fname, srtFname, allPairs, animation);
        }
    );

    animation.clear();

    notes.addProcessed(`    ${allPairs.length ? ` (${allPairs.length})`.padStart(7, ' ') : 'skipped'}: ${lastFolder}`);
}

function oneFileAction(targetFolder: string, shortMp4: string, shortSrt: string, final: MSPair[], animation: LineAnimation): void {
    const mp4FullFname = path.join(targetFolder, shortMp4);
    const srtFullFname = path.join(targetFolder, shortSrt);
    const outFullFname = path.join(targetFolder, `temp-tm-temp.mp4`);

    const appOptions = getAppOptions();

    checkFilenameMaxLen(targetFolder, srtFullFname, final);
    preprocessSubtitlesFileFormat(srtFullFname, appOptions);

    animation.updateAnimation(shortMp4);

    const result = ffmpegUtils.createFileMp4WithSrt(mp4FullFname, srtFullFname, outFullFname); //TODO: try/catch to clean up 'temp-tm-temp.mp4' in case of exception

    if (!result.skipped) {
        rimraf.sync(mp4FullFname);

        fs.renameSync(outFullFname, mp4FullFname);
        !appOptions.preserve && rimraf.sync(srtFullFname); // remove it as the last, in case if mp4 is locked by player.
    }
}

function preprocessSubtitlesFileFormat(fullFname: string, options: AppOptions): void {
    const ext = path.extname(fullFname).toLowerCase();

    if (ext !== '.vtt' && ext !== '.srt') {
        return;
    }

    const doSrt = ext === '.srt';

    const cnt = fs.readFileSync(fullFname, { encoding: 'utf-8' });
    let newCnt: ConvertSubtitlesResult = convertSubtitles({ fileContent: cnt, doSrt });

    if (newCnt.hasFixes) { // save if need
        createBackup(fullFname, options);
        fs.writeFileSync(fullFname, newCnt.newContent);
    }
}

function createBackup(fname: string, options: AppOptions) {
    if (!options.keepOrg) {
        return;
    }
    const backupName = replaceExt(fname, '.___backup-cc'); // replaceExt(fname, `._${path.extname(fname).substring(2) || ''}`);
    if (!exist(backupName)) {
        const cnt = fs.readFileSync(fname, { encoding: 'utf-8' });
        fs.writeFileSync(backupName, cnt);
    }
}
