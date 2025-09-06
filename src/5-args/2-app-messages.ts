import path from 'path';
import chalk from "chalk";
import { removeIndent } from "../utils";
import { type MSPair } from "./4-matched-pairs";

export function printFilenameLength(targetFolder: string, final: MSPair[]): void {
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

export function msgFnameTooLong(fname: string): string {
    let ss = removeIndent(`
        The filename is too long (${fname.length} characters):
        ${chalk.gray(fname)}
        
        ${chalk.yellow(`Rename the file so that the file name is ${fname.length - 248} character${fname.length - 255 === 1 ? '' : 's'} shorter.`)}`
    ).replace(/^\r?\n/, '');
    return ss;
}
