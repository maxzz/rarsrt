import fs from 'fs';
import path from 'path';
import { exist, replaceExt } from '../../utils/utils-os';
import { msgFnameTooLong, printFilenameLength } from "../app-messages";
import { notes } from "../app-notes";
import { AppOptions } from "../app-types";
import { MSPair } from "./matched-pairs";
import { ConvertAction, ConvertResult, convertVttToSrt, fixSrt } from "./subs";

export function checkMaxLength(targetFolder: string, srt: string, final: MSPair[]) {
    if (srt.length > 248) {
        process.stdout.write(`   \r`);

        notes.flushProcessed();
        printFilenameLength(targetFolder, final);

        throw Error(msgFnameTooLong(srt));
    }
}

export function checkSubtitlesFormat(fullFname: string, options: AppOptions) {
    const ext = path.extname(fullFname).toLowerCase();

    if (ext === '.vtt') {
        const cnt = fs.readFileSync(fullFname, { encoding: 'utf-8' });
        const newCnt: ConvertResult = convertVttToSrt(cnt, ConvertAction.fix);

        if (newCnt.hasFixes) {
            createBackup(fullFname);
            fs.writeFileSync(fullFname, newCnt.newContent);
        }
    } else if (ext === '.srt') {
        const cnt = fs.readFileSync(fullFname, { encoding: 'utf-8' });
        const newCnt: ConvertResult = fixSrt(cnt);

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
