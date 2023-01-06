import path from 'path';
import fs from 'fs';
import rimraf from 'rimraf';
import { fnames } from '../utils/utils-os';
import { OsStuff } from '../utils/utils-os-stuff';
import { notes } from './app-notes';
import { ffmpegUtils } from '../utils/utils-ffmpeg';
import { newErrorArgs } from '../utils/utils-errors';
import { ConvertAction, convertVttToSrt, fixSrt } from '../utils/utils-vtt';
import { LineAnimation, msgFnameTooLong, printFilenameLength } from './app-messages';
import { getAppOptions } from './app-arguments';
import { AppOptions } from './app-types';

export function handleFiles(filesToRar: string[]): void {
    // TOOO: Check: all files and folders should be inside the same folder (although it isn't possible with drag&drop).
    throw newErrorArgs('Separate handling of filenames has not yet been implemented');

    // 0. Simulate rardir behaviour. Files should be in the same folder.
    /*
        let root = path.dirname(filesToRar[0]);
        let files = filesToRar.map(_ => path.basename(_));
        let fnameRar = path.join(root, 'tm.rar');

        if (exist(fnameRar)) { // If tm.rar exist then use shift+drag to move into rar.
            notes.add(`--- INFO: tm.rar already exist here:\n    b:${root}`);
            return;
        }

        // Create dirs.txt and add to tm.rar.

        appUtils.createFileMp4WithSrt(fnameRar, root, files);
    */
}

export type MSPair = {  // mp4 and srt pair
    mp4?: string;       // short filename.mp4
    srt?: string;       // short filename[(_en| English)](.srt|.vtt)
};

function getMSPairs(targetFolder: string): MSPair[] {
    // 1. Get folders and files inside the target folder.
    let filesAndFolders: OsStuff.FolderItem = OsStuff.collectDirItems(targetFolder);

    // 2. Get what we have inside this folder.
    type FItem = OsStuff.FileItem & { ext: fnames.ExtType; };

    let fItems: FItem[] = filesAndFolders.files.map((_: OsStuff.FileItem) => ({ ..._, ext: fnames.castFileExtension(path.extname(_.short)) }));

    let msPairs: Record<string, MSPair> = {}; // short filename wo/ ext -> { mp4: short filename.mp4, srt: short filename(.srt|.vtt) }

    fItems.forEach((item: FItem) => {
        let base = path.parse(item.short).name;
        if (item.ext === fnames.ExtType.mp4) {
            (msPairs[base] || (msPairs[base] = {})).mp4 = item.short;
        }
        else if (item.ext === fnames.ExtType.srt) {
            base = base.replace(/\.en$/, '').replace(/_en$/i, ''); // handle case: 'name.en.srt' and 'name_en.srt'
            (msPairs[base] || (msPairs[base] = {})).srt = item.short;
        }
        else if (item.ext === fnames.ExtType.vtt) {
            base = base.replace(/ English$/i, '').replace(/_en$/i, ''); // handle case: 'name English.vtt'; or it can be 'name French.vtt'
            (msPairs[base] || (msPairs[base] = {})).srt = item.short;
        }
    }); //TODO: we can first iteration find all mp4 and then match base againts sub title filenames.

    return (Object.values(msPairs)).filter((pair) => pair.mp4 && pair.srt);
}

function checkMaxLength(targetFolder: string, srt: string, final: MSPair[]) {
    if (srt.length > 248) {
        process.stdout.write(`   \r`);

        notes.flushProcessed();
        printFilenameLength(targetFolder, final);

        throw Error(msgFnameTooLong(srt));
    }
}

function checkSubtitlesFormat(fullFname: string, options: AppOptions) {
    if (options.keepOrg) {
        return;
    }
    const isVtt = path.extname(fullFname).toLowerCase();
    if (isVtt === '.vtt') {
        const cnt = fs.readFileSync(fullFname, { encoding: 'utf-8' });
        const newCnt = convertVttToSrt(cnt, ConvertAction.fix);
        if (newCnt.hasFixes) {
            fs.writeFileSync(fullFname, newCnt.newContent);
        }
    }
    else if (isVtt === '.srt') {
        const cnt = fs.readFileSync(fullFname, { encoding: 'utf-8' });
        const newCnt = fixSrt(cnt);
        if (newCnt.hasFixes) {
            fs.writeFileSync(fullFname, newCnt.newContent);
        }
    }
}

function oneFileAction(lineAnimation: LineAnimation, targetFolder: string, shortMp4: string, shortSrt: string, final: MSPair[]) {
    const mp4 = path.join(targetFolder, `${shortMp4}`);
    const srt = path.join(targetFolder, `${shortSrt}`);
    const out = path.join(targetFolder, `temp-tm-temp.mp4`);

    const options = getAppOptions();
    checkMaxLength(targetFolder, srt, final);
    checkSubtitlesFormat(srt, options);

    lineAnimation.writeStateLine(shortMp4);
    const result = ffmpegUtils.createFileMp4WithSrt(mp4, srt, out); //TODO: try/catch to clean up 'temp-tm-temp.mp4' in case of exception
    //lineAnimation.cleanStateLine();

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

    notes.addProcessed(`    ${final.length ? ` (${final.length})`.padStart(7, ' ') : 'skipped'}: ${lastFolder}`);
}

export function handleFolders(dirs: string[]) {
    for (let dir of dirs) {
        handleFolder(dir);
    }
}

//added global node-vtt-to-srt //https://www.npmjs.com/package/node-vtt-to-srt (vtt-to-srt will not work): 'node-vtt-to-srt lesson01.srt < lesson01.vtt'

//TBD: if folder has N of mp4 and N of str(or vtt) then we can match on first M matching characters (from srt or mp4 filename).
//  like 43 - 31564200.mp4 and 43 - E2E Tests English.vtt

//TODO: coursehunter: write content file as ansi file with coding page 1251

//TODO: remove srt and vtt pairs after merge is successful - done

//TODO: check file length < 255 before any operations; not folder by folder

//TODO: remove/subtract (to file) subtitles
