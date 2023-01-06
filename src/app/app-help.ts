import chalk from 'chalk';

const APP_NAME = "rarsrt"; //let cfg = require('../../package.json');
const APP_VERSION = "1.2.4";

export function help() {
    let txt = `
${chalk.cyan(APP_NAME)} utility will combine .SRT subtitles with .MP4 files
inside specified folder(s). ${APP_NAME} version is ${APP_VERSION}.

Usage: ${APP_NAME} <file(s).mp4> | <folder(s)> [options]

options

  --preserve    don't delete subtitle files after successful 
                merge (default = false).`;

    console.log(txt);
}
