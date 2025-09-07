import fs from "fs";
import path from "path";
import { exist, notes, replaceExt } from "../utils";
import { msgFnameTooLong, printFilenameLength } from "../5-args/2-app-messages";
import { type AppOptions } from "../5-args/9-types-args";
import { type MSPair } from "../5-args/4-matched-pairs";
import { type ConvertSubtitlesResult, convertSubtitles } from "../1-subs";

export function checkFilenameMaxLen(targetFolder: string, srt: string, final: MSPair[]) {
    if (srt.length > 248) {
        process.stdout.write(`   \r`);

        notes.flushProcessed();
        printFilenameLength(targetFolder, final);

        throw Error(msgFnameTooLong(srt));
    }
}

export function preprocessSubtitlesFileFormat(fullFname: string, options: AppOptions): void {
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
