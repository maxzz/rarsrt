import path from 'path';
import chalk from 'chalk';
import { exitProcess, newErrorArgs } from './utils/utils-errors';
import { help } from './utils/app-help';
import { notes } from './utils/app-notes';
import { ffmpegUtils } from './utils/utils-ffmpeg';
import { getTargets } from './utils/app-arguments';
import { handleFiles, handleFolders } from './utils/app';
import { Targets } from './utils/app-types';

async function main() {
    ffmpegUtils.findFFMpeg();

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
//TODO: handle .avi files like .mp4 as well?
