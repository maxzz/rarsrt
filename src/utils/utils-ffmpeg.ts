import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { removeIndent } from './utils-os';
import { notes } from './app-notes';

export namespace ffmpegUtils {

    let FFMPEG: string;

    export function findFFMpeg() {
        try {
            FFMPEG = execSync(`where ffmpeg`).toString().split(/[\r\n]/)[0];
        } catch (error) {
            throw new Error(`${error}\nMake path to ffmpeg.exe as part of PATH`);
        }
    }

    function createFileMp4WithSrtNoThrou(fullNameMp4: string, fullNameSrt: string, fullNameOut: string, loglevel: string = 'error') : { stderr: string, cmderr: string, isMultilineSrt: boolean } | undefined {
        // -y is to overwrite destination file.
        // -loglevel quiet is to reduce console output, but still will show errors. (alternatives: -nostats -hide_banner).
        // if file already has subtitles it will overwrite existing, i.e. not duplicate. actually it will skip the new one.
        // TODO: We may run it again to get nice error message <- done

        // If error is: "<filename>.srt: Invalid data found when processing input"
        // Then very likely srt file has extra empty lines, so we can remove all empty lines.

        let cmd = `"${FFMPEG}" -y -loglevel ${loglevel} -i "${fullNameMp4}" -i "${fullNameSrt}" -c copy -c:s mov_text -metadata:s:s:0 language=eng "${fullNameOut}"`;
        try {
            execSync(cmd, {stdio: ['inherit', 'inherit', 'pipe']});
        } catch (error) {
            let isMultilineSrt = false;

            const childError: string = error.stderr.toString();
            if (childError.match(/\.srt: Invalid data found when processing input/)) {
                isMultilineSrt = true;
            }

            const errMsg = chalk.gray(removeIndent(`
                ${chalk.yellow('Failed to proceed:')}
                    ${path.basename(fullNameMp4)}
                    ${path.basename(fullNameSrt)}

                ${chalk.yellow('Folder:')}
                ${path.dirname(fullNameSrt)}
                ${chalk.yellow('Command:')}
                ${cmd}`).replace(/^\r?\n/, ''));

            return {
                stderr: childError,
                cmderr: errMsg,
                isMultilineSrt,
            };
        }
    }

    export function createFileMp4WithSrt(fullNameMp4: string, fullNameSrt: string, fullNameOut: string): { skipped: boolean } | undefined {
        let error = createFileMp4WithSrtNoThrou(fullNameMp4, fullNameSrt, fullNameOut);
        if (error) {
            // Try to recover the bad srt file formatting.
            if (error.isMultilineSrt) {
                let srtCnt = fs.readFileSync(fullNameSrt, 'utf8');
                let lines = srtCnt.split(/\r?\n/).filter(Boolean);
                fs.writeFileSync(fullNameSrt, lines.join('\r\n'));
                error = createFileMp4WithSrtNoThrou(fullNameMp4, fullNameSrt, fullNameOut);
            }
            if (error) {
                // If did not recovered the bad srt file formatting then report but continue with other files.
                if (error.isMultilineSrt) {
                    notes.add(chalk.red(`* Skipped file merge (bad .srt format):\n  Folder: ${path.dirname(fullNameSrt)}\n    File: ${path.basename(fullNameSrt)}`));
                    return { skipped: true };
                } else {
                    process.stdout.write(chalk.red(`         \rError (from ffmpeg):\n\n${error.stderr}\n`));
                    error = createFileMp4WithSrtNoThrou(fullNameMp4, fullNameSrt, fullNameOut, 'verbose');
                    process.stdout.write(chalk.white('Error details:\n'));
                    process.stdout.write(chalk.gray(error.stderr));
                    console.log(chalk.white('------------------'));
                    throw new Error(error.cmderr);
                }
            }
        }
    }

} //namespace ffmpegUtils
