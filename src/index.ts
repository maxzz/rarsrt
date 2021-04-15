import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { exist, fnames, removeIndent } from './os-utils';
import { exitProcess, help, newErrorArgs, notes } from './process-utils';
import rimraf from 'rimraf';

namespace osStuff {

    export type fileItem = {
        short: string;      // filename wo/ path
        btime: Date;        // file created (birthtime) timestamp
        mtime?: Date;       // file data modified timestamp; present if different from btime
        size: number;       // file size
    };

    export type folderItem = {
        name: string;       // Folder full name
        files: fileItem[];  // Short filenames i.e. wo/ path.
        subs: folderItem[]; // Sub-folders.
    };

    function collectFiles(dir: string, rv: folderItem, recursive: boolean): void {
        rv.files.push(...fs.readdirSync(dir).map((_) => {
            let fname = path.join(dir, _);
            let st = fs.statSync(fname);
            if (st.isDirectory()) {
                if (recursive) {
                    let newFolder: folderItem = {
                        name: fname,
                        files: [],
                        subs: [],
                    };
                    collectFiles(fname, newFolder, recursive);
                    if (newFolder.files.length || newFolder.subs.length) {
                        rv.subs.push(newFolder);
                    }
                }
            } else if (st.isFile()) {
                let newFile: fileItem = {
                    short: _,
                    btime: st.birthtime,
                    ...(st.birthtime !== st.mtime && { mtime: st.mtime }),
                    size: st.size,
                };
                return newFile;
            }
        }).filter(Boolean));
    }

    export function collectDirItems(dir: string): folderItem {
        let rv: folderItem = {
            name: dir,
            files: [],
            subs: [],
        };
        collectFiles(dir, rv, true);
        return rv;
    }

} //namespace osStuff

namespace appUtils {

    let FFMPEG: string;

    export function createFileMp4WithSrt(fullNameMp4: string, fullNameSrt: string, fullNameOut: string) {
        // -y is to overwrite destination file.
        // -loglevel quiet is to reduce console output, but still will show errors. (alternatives: -nostats -hide_banner).
        // if file already has subtitles it will overwrite existing, i.e. not duplicate. actually it will skip the new one.

        let cmd = `"${FFMPEG}" -y -loglevel error -i "${fullNameMp4}" -i "${fullNameSrt}" -c copy -c:s mov_text -metadata:s:s:0 language=eng "${fullNameOut}"`;
        try {
            let stderr = execSync(cmd, {stdio: 'ignore'});
            //console.log(`stdeee`, stderr.toString());
        } catch (error) {
            //console.log(`stdout`, error.stderr.toString());
            // TODO: run it again to get nice error message
            let s = chalk.gray(removeIndent(`
                ${chalk.red('Failed to create')}
                    ${fullNameMp4}
                    ${fullNameSrt}
                    ${fullNameOut}
                
                ${chalk.red('Command:')}
                ${cmd}
                
                ${chalk.red('Error:')}
                `)) + chalk.gray(error.message);
            throw new Error(s);
            // throw new Error(`Failed to create \n    ${fullNameMp4}\n    ${fullNameSrt}\n    ${fullNameOut}\n\nCommand:\n${cmd}\n\nError:\n${error.message}\n`);
        }
    }

    export function findFFMpeg() {
        try {
            FFMPEG = execSync(`where ffmpeg`).toString().split(/[\r\n]/)[0];
        } catch (error) {
            throw new Error(`${error}\nMake path to ffmpeg.exe as part of PATH`);
        }
    }

} //namespace appUtils

function handleFiles(filesToRar: string[]): void {
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

function handleFolder(targetFolder: string) {
    // 0. Collect names with .mp4 and .srt combine them into pairs and merge.
    let lastFolder = path.basename(targetFolder) || targetFolder;

    // 1. Get folders and files inside the target folder.
    let filesAndFolders: osStuff.folderItem = osStuff.collectDirItems(targetFolder);

    // 2. Get what we have inside this folder.
    type FItem = osStuff.fileItem & { ext: fnames.extType; };

    let fItems: FItem[] = filesAndFolders.files.map((_: osStuff.fileItem) => ({ ..._, ext: fnames.castFileExtension(path.extname(_.short)) }));

    type MSPair = { // mp4 and srt pair
        mp4?: string;
        srt?: string;
    };

    type MSPairs = Record<string, MSPair>;

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

    function printFilenameLength(targetFolder: string, final: [string, MSPair][]): void {
        let oneLong = final.filter(([name, pair]) => targetFolder.length + pair.srt.length > 248).length === 1;
        console.log(`${chalk.yellow(`The file name${oneLong ? '' : 's'} in the folder ${oneLong ? 'is': 'are'} too long.`)}\nThe maximum file name length must not exceed 248 characters.\nThe folder name is ${targetFolder.length} characters long, so ${248-targetFolder.length} characters remain for the longest name in that folder.\n\n${chalk.yellow('Folder:')}\n${targetFolder}\n\n${chalk.yellow('The lengths of the filenames in the folder:')}\n    length | name \n    -------|------------------`);
        final.forEach(([name, pair]) => {
            let s = path.join(targetFolder, `${pair.srt}`);
            let isLong = s.length > 248;
            let n = isLong ? `${s.length - 248}+248` : `${s.length}`;
            console.log(`   ${chalk[isLong ? 'red' : 'white'](n.padStart(7, ' '))} | ${pair.srt}`);
        });
    }

    function oneFileAction(targetFolder: string, shortMp4: string, shortSrt: string, shortOut: string) {
        let mp4 = path.join(targetFolder, `${shortMp4}`);
        let srt = path.join(targetFolder, `${shortSrt}`);
        let out = path.join(targetFolder, `temp-tm-temp.mp0`);

        if (srt.length > 248) {
            notes.flushProcessed();
            printFilenameLength(targetFolder, final);
            throw Error(`The filename is too long (${srt.length} characters):\n    ${srt}\n\nRename the file so that the file name is ${srt.length - 248} character${srt.length - 255 === 1 ? '' : 's'} shorter.`);
        }

        appUtils.createFileMp4WithSrt(mp4, srt, out);

        rimraf.sync(srt);
        rimraf.sync(mp4);
        fs.renameSync(out, mp4);
    }

    let final: [string, MSPair][] = (Object.entries(msPairs)).filter((pair: [string, MSPair]) => pair[1].mp4 && pair[1].srt);
    final.forEach(([name, pair]) => oneFileAction(targetFolder, pair.mp4, pair.srt, name));

    notes.addProcessed(`    ${final.length ? ` (${final.length})`.padStart(7, ' ') : 'skipped'}: ${lastFolder}`);
}

function checkArg(argTargets: string[]): { files: string[]; dirs: string[]; } {
    let rv = {
        files: [],
        dirs: [],
    };

    for (let target of argTargets) {
        let current: string = path.resolve(target); // relative to the start up folder
        let st = exist(current);
        if (st) {
            if (st.isDirectory()) {
                rv.dirs.push(current);
            } else if (st.isFile()) {
                rv.files.push(current); // TODO: Check all files should have the same root folder. That is not possible with drag and drop, but still ...
            }
        } else {
            throw newErrorArgs(`Target "${target}" does not exist.`);
        }
    }

    return rv;
}

async function main() {
    appUtils.findFFMpeg();

    let args = require('minimist')(process.argv.slice(2), {
    });

    //console.log(`args ${JSON.stringify(args, null, 4)}`);
    //await exitProcess(0, '');

    let targets = checkArg(args._ || []);

    // If we have a single top folder and no top files w/ drag&drop then check what we have inside.
    if (targets.dirs.length === 1 && !targets.files.length) {
        let rootFolders: osStuff.folderItem = osStuff.collectDirItems(targets.dirs[0]); // one of cases with 'rarsrt .'
        targets.dirs.push(...rootFolders.subs.map((_: osStuff.folderItem) => _.name));
    }

    // console.log(`targets ${JSON.stringify(targets, null, 4)}`);
    // await exitProcess(0, '');

    if (targets.files.length) {
        throw newErrorArgs('Separate handling of filenames has not yet been implemented');

        handleFiles([...targets.files, ...targets.dirs]); // TOOO: Check: all files and folders should be inside the same folder (although it isn't possible with drag&drop).
    } else if (targets.dirs.length) {
        for (let dir of targets.dirs) {
            handleFolder(dir);
        }
    } else {
        throw newErrorArgs(`Specify at leats one folder or files name to process`);
    }

    if (notes.willShow()) {
        if (targets.dirs.length) {
            let rootDir = path.dirname(targets.dirs[0]);
            console.log(chalk.blueBright(`Processing root:\n${rootDir}\n`));
        }
        //TODO: else [...targets.files, ...targets.dirs]
    }

    notes.show(false);
}

main().catch(async (error) => {
    error.args && help(); // Show help only if arguments are invalid.
    let errorMsg = `${notes.buildMessage()}${chalk[error.args ? 'yellow' : 'red'](`\n${error.message}`)}`;
    await exitProcess(1, errorMsg);
});
