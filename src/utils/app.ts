import fs from 'fs';
import chalk from 'chalk';
import rimraf from 'rimraf';
import { fnames, removeIndent } from './utils-os';
import { osStuff } from './utils-os-stuff';
import { notes } from './app-notes';
import { appUtils } from './app-ffmpeg';

export function handleFiles(filesToRar: string[]): void {
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

type MSPair = { // mp4 and srt pair
    mp4?: string;
    srt?: string;
};

type MSPairs = Record<string, MSPair>;

function getMSPairs(targetFolder: string): MSPairs {
    // 1. Get folders and files inside the target folder.
    let filesAndFolders: osStuff.folderItem = osStuff.collectDirItems(targetFolder);

    // 2. Get what we have inside this folder.
    type FItem = osStuff.fileItem & { ext: fnames.extType; };

    let fItems: FItem[] = filesAndFolders.files.map((_: osStuff.fileItem) => ({ ..._, ext: fnames.castFileExtension(path.extname(_.short)) }));

    let msPairs: MSPairs = {};

    fItems.forEach((item: FItem) => {
        let base = path.parse(item.short).name;
        if (item.ext === fnames.extType.mp4) {
            (msPairs[base] || (msPairs[base] = {})).mp4 = item.short;
        } else if (item.ext === fnames.extType.srt) {
            base = base.replace(/\.en$/, ''); // handle case: 'name.en.srt'
            (msPairs[base] || (msPairs[base] = {})).srt = item.short;
        }
    });

    return msPairs;
}

function printFilenameLength(targetFolder: string, final: [string, MSPair][]): void {
    let oneLong = final.filter(([name, pair]) => targetFolder.length + pair.srt.length > 248).length === 1;

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

    final.forEach(([name, pair]) => {
        let s = path.join(targetFolder, `${pair.srt}`);
        let isLong = s.length > 248;
        let n = isLong ? `${s.length - 248}+248` : `${s.length}`;
        console.log(`   ${chalk[isLong ? 'red' : 'white'](n.padStart(7, ' '))} | ${pair.srt}`);
    });
}

export function handleFolder(targetFolder: string) {
    // 0. Collect names with .mp4 and .srt combine them into pairs and merge.
    let lastFolder = path.basename(targetFolder) || targetFolder;

    let msPairs: MSPairs = getMSPairs(targetFolder);

    let animIndex = 0;
    let animations = [".", "o", "O", "o"]; // TODO: write item of # items and current item name

    function oneFileAction(targetFolder: string, shortMp4: string, shortSrt: string, shortOut: string) {
        process.stdout.write(` ${animations[animIndex++ % animations.length]}${animations[animIndex % animations.length]}${animations[(animIndex + 1) % animations.length]}\r`);

        let mp4 = path.join(targetFolder, `${shortMp4}`);
        let srt = path.join(targetFolder, `${shortSrt}`);
        let out = path.join(targetFolder, `temp-tm-temp.mp4`);

        if (srt.length > 248) {
            process.stdout.write(`   \r`);

            notes.flushProcessed();
            printFilenameLength(targetFolder, final);
            let ss = removeIndent(`
                The filename is too long (${srt.length} characters):
                ${chalk.gray(srt)}
                
                ${chalk.yellow(`Rename the file so that the file name is ${srt.length - 248} character${srt.length - 255 === 1 ? '' : 's'} shorter.`)}`
            ).replace(/^\r?\n/, '');
            //let ss = `The filename is too long (${srt.length} characters):\n    ${srt}\n\nRename the file so that the file name is ${srt.length - 248} character${srt.length - 255 === 1 ? '' : 's'} shorter.`;
            throw Error(ss);
        }

        let result = appUtils.createFileMp4WithSrt(mp4, srt, out);
        process.stdout.write(`   \r`);

        if (!result?.skipped) {
            rimraf.sync(srt);
            rimraf.sync(mp4);
            fs.renameSync(out, mp4);
        }
    }

    let final: [string, MSPair][] = (Object.entries(msPairs)).filter((pair: [string, MSPair]) => pair[1].mp4 && pair[1].srt);
    final.forEach(([name, pair]) => oneFileAction(targetFolder, pair.mp4, pair.srt, name));

    notes.addProcessed(`    ${final.length ? ` (${final.length})`.padStart(7, ' ') : 'skipped'}: ${lastFolder}`);
}
