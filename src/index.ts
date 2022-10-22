import path from 'path';
import chalk from 'chalk';
import { exitProcess, newErrorArgs } from './utils/utils-errors';
import { OsStuff } from './utils/utils-os-stuff';
import { help } from './utils/app-help';
import { notes } from './utils/app-notes';
import { appUtils } from './utils/app-ffmpeg';
import { checkArg } from './utils/app-arguments';
import { handleFiles, handleFolder } from './utils/app';
import { Targets } from './utils/app-types';

async function main() {
    appUtils.findFFMpeg();

    // console.log('args', JSON.stringify(process.argv.slice(2), null, 4));
    // await exitProcess(0, '');

    let args = require('minimist')(process.argv.slice(2), {
    });

    //console.log(`args ${JSON.stringify(args, null, 4)}`);
    //await exitProcess(0, '');

    let targets: Targets = checkArg(args._ || []);

    // If we have a single top folder and no top files w/ drag&drop then check what we have inside.
    if (targets.dirs.length === 1 && !targets.files.length) {
        let rootFolders: OsStuff.FolderItem = OsStuff.collectDirItems(targets.dirs[0]); // one of cases with 'rarsrt .'
        targets.dirs.push(...rootFolders.subs.map((_: OsStuff.FolderItem) => _.name));
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
            console.log(chalk.blueBright(`Processed root:\n${rootDir}`));
        }
        //TODO: else [...targets.files, ...targets.dirs]
    }

    await notes.show(false);
}

main().catch(async (error) => {
    error.args && help(); // Show help only if arguments are invalid.
    let errorMsg = `${notes.buildMessage()}${chalk[error.args ? 'yellow' : 'red'](`\n${error.message}`)}`;
    await exitProcess(1, errorMsg);
});

//TODO: add option for encoding .srt files: win1251 -> utf8
//TODO: handle .avi files as well?
