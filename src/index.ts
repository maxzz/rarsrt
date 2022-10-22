import path from 'path';
import chalk from 'chalk';
import { exitProcess, newErrorArgs } from './utils/utils-errors';
import { OsStuff } from './utils/utils-os-stuff';
import { help } from './utils/app-help';
import { notes } from './utils/app-notes';
import { appUtils } from './utils/app-ffmpeg';
import { checkArg } from './utils/app-arguments';
import { handleFiles, handleFolders } from './utils/app';
import { Targets } from './utils/app-types';

function getTargets(): Targets {
    // console.log('args', JSON.stringify(process.argv.slice(2), null, 4));
    // await exitProcess(0, '');

    const args = require('minimist')(process.argv.slice(2), {
    });

    //console.log(`args ${JSON.stringify(args, null, 4)}`);
    //await exitProcess(0, '');

    const targets: Targets = checkArg(args._ || []);

    if (targets.dirs.length === 1 && !targets.files.length) {
        // If we have a single top folder and no top files w/ drag&drop then check what we have inside.
        let rootFolders: OsStuff.FolderItem = OsStuff.collectDirItems(targets.dirs[0]); // one of cases with 'rarsrt .'
        targets.dirs.push(...rootFolders.subs.map((_: OsStuff.FolderItem) => _.name));
    }

    // console.log(`targets ${JSON.stringify(targets, null, 4)}`);
    // await exitProcess(0, '');

    return targets;
}

async function main() {
    appUtils.findFFMpeg();

    const targets: Targets = getTargets();

    if (targets.files.length) {
        handleFiles([...targets.files, ...targets.dirs]);
    } else if (targets.dirs.length) {
        handleFolders(targets.dirs);
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
