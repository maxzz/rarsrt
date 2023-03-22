import fs from 'fs';
import path from 'path';
import { exist, replaceExt } from '../../utils/utils-os';
import { msgFnameTooLong, printFilenameLength } from "../app-messages";
import { notes } from "../app-notes";
import { AppOptions } from "../app-types";
import { MSPair } from "./matched-pairs";
import { ConvertResult, convertSubtitles } from "./subs";

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
    let newCnt: ConvertResult = convertSubtitles({ fileContent: cnt, doSrt });
    saveIfNeed(fullFname, newCnt);

    function saveIfNeed(fullFname: string, newCnt: ConvertResult) {
        if (newCnt.hasFixes) {
            createBackup(fullFname);
            fs.writeFileSync(fullFname, newCnt.newContent);
        }
    }

    function createBackup(fname: string) {
        if (!options.keepOrg) {
            return;
        }
        const backupName = replaceExt(fname, '.___'); // replaceExt(fname, `._${path.extname(fname).substring(2) || ''}`);
        if (!exist(backupName)) {
            const cnt = fs.readFileSync(fullFname, { encoding: 'utf-8' });
            fs.writeFileSync(backupName, cnt);
        }
    }
}
