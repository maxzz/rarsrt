import chalk from 'chalk';
let cfg = require('../../package.json');

export function help() {
    let help = `
${chalk.cyan('rarsrt')} utility will combine .SRT subtitles with .MP4 files inside specified folders..
Version ${cfg.version}
Usage: rarsrt <file(s).mp4> | <folder(s)>`;
    console.log(help);
}
