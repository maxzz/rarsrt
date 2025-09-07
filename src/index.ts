import path from "path";
import chalk from "chalk";
import { ffmpegUtils, help, notes } from "./utils";
import { type Targets, getTargets } from "./5-args";
import { exitProcess } from "./utils/7-utils-errors";
import { processArgs } from "./0-all-app";

async function main() {
    ffmpegUtils.whereFFMpeg();

    const targets: Targets = getTargets();

    await processArgs(targets);

    if (notes.willShow()) {
        if (targets.dirs.length) {
            const rootDir = path.dirname(targets.dirs[0]);
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

//app.ts
    //added global node-vtt-to-srt //https://www.npmjs.com/package/node-vtt-to-srt (vtt-to-srt will not work): 'node-vtt-to-srt lesson01.srt < lesson01.vtt'

    //TBD: if folder has N of mp4 and N of str(or vtt) then we can match on first M matching characters (from srt or mp4 filename).
    //  like 43 - 31564200.mp4 and 43 - E2E Tests English.vtt

    //TODO: coursehunter: write content file as ansi file with coding page 1251

    //TODO: remove srt and vtt pairs after merge is successful - done

    //TODO: check file length < 255 before any operations; not folder by folder

    //TODO: remove/subtract (to file) subtitles
