import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { exist } from './os-utils';
import { exitProcess, help, newErrorArgs, notes } from './process-utils';

namespace osStuff {

} //namespace osStuff

namespace appUtils {

    let FFMPEG: string;
    
    export function createFileMp4WithSrt(fullNameRar: string, baseFolderForShortNames: string, shortNamesToRar: string[]) {
        if (!shortNamesToRar.length) {
            throw new Error(`No files to move into ${fullNameRar}`);
        }
    
        let names = shortNamesToRar.map(_ => `"${_}"`).join(' ');
        let cmd = `"${FFMPEG}" m \"${fullNameRar}\" ${names}`; // Don't use 'start', it will spawn new process and we receive closed handle of start not winrar.
        try {
            execSync(cmd, {cwd: baseFolderForShortNames});
        } catch (error) {
            throw new Error(`Failed to create ${fullNameRar}\n${error.message}\n`);
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

    let root = path.dirname(filesToRar[0]);
    let files = filesToRar.map(_ => path.basename(_));
    let fnameRar = path.join(root, 'tm.rar');

    if (exist(fnameRar)) { // If tm.rar exist then use shift+drag to move into rar.
        notes.add(`--- INFO: tm.rar already exist here:\n    b:${root}`);
        return;
    }

    // Create dirs.txt and add to tm.rar.

    appUtils.createFileMp4WithSrt(fnameRar, root, files);
}

function handleFolder(dir: string) {

}

function checkArg(argTargets: string[]): { files: string[]; dirs: string[] } {
    let rv =  {
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
    
    console.log(`args ${JSON.stringify(args, null, 4)}`);
    //await exitProcess(0, '');

    let targets = checkArg(args._ || []);
/*
    // If we have a single top folder and no top files w/ drag&drop then check what we have inside.
    if (targets.dirs.length === 1 && !targets.files.length) {
        let target = targets.dirs[0];

        if (path.basename(target).toLowerCase() === 'tm') {
            targets.files = fs.readdirSync(target).map(_ => path.join(target, _));
            targets.dirs = [];
        } else {
            let root: osStuff.folderItem = osStuff.collectDirItems(target);
            if (root.files.length) {
                // This is not an error, just a regular case.
                //notes.add(`--- INFO: Skipped mixed content (folder(s) and file(s) in:)\n    b:${root.name}`);
            } else {
                targets.dirs = root.subs.map((_: osStuff.folderItem) => _.name);
            }
        }
    }

    // console.log(`targets ${JSON.stringify(targets, null, 4)}`);
    // await exitProcess(0, '');

    if (targets.files.length) {
        handleFiles([...targets.files, ...targets.dirs]); // TOOO: Check: all files and folders should be inside the same folder (although it isn't possible with drag&drop).
    } else if (targets.dirs.length) {
        for (let dir of targets.dirs) {
            handleFolder(dir);
        }
    } else {
        throw newErrorArgs(`Specify at leats one folder or files name to process.`);
    }
*/
    notes.show();
}

main().catch(async (error) => {
    error.args && help(); // Show help if args are invalid
    await exitProcess(1, `${notes.buildMessage()}${chalk[error.args ? 'yellow' : 'red'](`\n${error.message}`)}`);
});
