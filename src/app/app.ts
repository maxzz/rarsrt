import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import rimraf from 'rimraf';
import { fnames } from '../utils/utils-os';
import { removeIndent } from '../utils/utils-es6';
import { OsStuff } from '../utils/utils-os-stuff';
import { notes } from './app-notes';
import { ffmpegUtils } from './utils-ffmpeg';
import { newErrorArgs } from '../utils/utils-errors';

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

type MSPair = {     // mp4 and srt pair
    mp4?: string;   // short filename.mp4
    srt?: string;   // short filename[(_en| English)](.srt|.vtt)
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

function printFilenameLength(targetFolder: string, final: MSPair[]): void {
    let oneLong = final.filter((pair) => targetFolder.length + pair.srt.length > 248).length === 1;

    let ss = removeIndent(`
        ${chalk.yellow(`The file name${oneLong ? '' : 's'} in the folder ${oneLong ? 'is' : 'are'} too long.`)}
        The maximum file name length must not exceed 248 characters.
        The folder name is ${chalk.gray(`${targetFolder.length}`)} characters long, so ${chalk.gray(`${248 - targetFolder.length}`)} characters remain for the longest name in that folder.
        
        ${chalk.yellow('Folder:')}
        ${targetFolder}
        
        ${chalk.yellow('The lengths of the filenames in the folder:')}
            length | name
            -------|------------------`);
    console.log(ss);

    final.forEach((pair) => {
        let s = path.join(targetFolder, `${pair.srt}`);
        let isLong = s.length > 248;
        let n = isLong ? `${s.length - 248}+248` : `${s.length}`;
        console.log(`   ${chalk[isLong ? 'red' : 'white'](n.padStart(7, ' '))} | ${pair.srt}`);
    });
}

type AnimationState = { animIndex: number; animations: string[]; };

function updateAnimation(st: AnimationState) {
    const { animations: ani } = st;
    const len = ani.length;
    process.stdout.write(` ${ani[st.animIndex++ % len]}${ani[st.animIndex % len]}${ani[(st.animIndex + 1) % len]}\r`);
}

function checkMaxLength(targetFolder: string, srt: string, final: MSPair[]) {
    if (srt.length > 248) {
        process.stdout.write(`   \r`);

        notes.flushProcessed();
        printFilenameLength(targetFolder, final);

        let ss = removeIndent(`
            The filename is too long (${srt.length} characters):
            ${chalk.gray(srt)}
            
            ${chalk.yellow(`Rename the file so that the file name is ${srt.length - 248} character${srt.length - 255 === 1 ? '' : 's'} shorter.`)}`
        ).replace(/^\r?\n/, '');

        throw Error(ss);
    }
}

function oneFileAction(animationState: AnimationState, targetFolder: string, shortMp4: string, shortSrt: string, final: MSPair[]) {
    updateAnimation(animationState);

    let mp4 = path.join(targetFolder, `${shortMp4}`);
    let srt = path.join(targetFolder, `${shortSrt}`);
    let out = path.join(targetFolder, `temp-tm-temp.mp4`);

    checkMaxLength(targetFolder, srt, final);

    let result = ffmpegUtils.createFileMp4WithSrt(mp4, srt, out); //TODO: try/catch to clean up 'temp-tm-temp.mp4' in case of exception
    process.stdout.write(`   \r`);

    if (!result?.skipped) {
        rimraf.sync(srt);
        rimraf.sync(mp4);
        fs.renameSync(out, mp4);
    }
}

function handleFolder(targetFolder: string) {
    // 0. Collect names with .mp4 and .srt combine them into pairs and merge.
    const animationState: AnimationState = {
        animIndex: 0,
        animations: [".", "_", "_", "_", "o", "O", "o", "_", "_", "_"], // TODO: write item of # items and current item name
    };

    let lastFolder = path.basename(targetFolder) || targetFolder;

    let final: MSPair[] = getMSPairs(targetFolder);

    final.forEach(({ mp4, srt }) => oneFileAction(animationState, targetFolder, mp4, srt, final));

    notes.addProcessed(`    ${final.length ? ` (${final.length})`.padStart(7, ' ') : 'skipped'}: ${lastFolder}`);
}

export function handleFolders(dirs: string[]) {
    for (let dir of dirs) {
        handleFolder(dir);
    }
}

//add global node-vtt-to-srt //https://www.npmjs.com/package/node-vtt-to-srt (vtt-to-srt will not work): 'node-vtt-to-srt lesson01.srt < lesson01.vtt'
