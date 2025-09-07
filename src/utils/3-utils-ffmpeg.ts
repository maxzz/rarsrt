import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import chalk from "chalk";
import { removeIndent } from "./7-utils-es6";
import { notes } from "./2-app-notes";

export namespace ffmpegUtils {
    let FFMPEG_path: string;

    export function findFFMpeg() {
        try {
            FFMPEG_path = execSync(`where ffmpeg`).toString().split(/[\r\n]/)[0];
        } catch (error) {
            throw new Error(`Make path to ffmpeg.exe as part of PATH.\n\n${error}`);
        }
    }

    export function createFileMp4WithSrt(fullNameMp4: string, fullNameSrt: string, fullNameOut: string): { skipped: boolean; } {
        let error = execFfmpeg(fullNameMp4, fullNameSrt, fullNameOut);
        if (error) {
            // Try to recover the bad srt file formatting.
            if (error.isMultilineSrt) {
                let srtCnt = fs.readFileSync(fullNameSrt, 'utf8');
                let lines = srtCnt.split(/\r?\n/).filter(Boolean);
                fs.writeFileSync(fullNameSrt, lines.join('\r\n'));
                error = execFfmpeg(fullNameMp4, fullNameSrt, fullNameOut);
            }

            if (error) {
                // If did not recovered the bad srt file formatting then report but continue with other files.
                if (error.isMultilineSrt) {
                    const msg = [
                        chalk.red(`* Skipped file merge (bad .srt format):`),
                        chalk.gray(`  Folder:\n  ${path.dirname(fullNameSrt)}`),
                        chalk.gray(`  File:\n  ${path.basename(fullNameSrt)}`),
                    ].join('\n');
                    notes.add(msg);
                } else {
                    process.stdout.write(chalk.red(`         \rError (from ffmpeg):\n\n${error.stderr}\n`));
                    error = execFfmpeg(fullNameMp4, fullNameSrt, fullNameOut, 'verbose');
                    if (error) {
                        process.stdout.write(chalk.white('Error details:\n'));
                        process.stdout.write(chalk.gray(error.stderr));
                        console.log(chalk.white('------------------'));
                        throw new Error(error.cmderr);
                    }
                }
            }
        }
        return { skipped: !!error };
    }

    function execFfmpeg(fullNameMp4: string, fullNameSrt: string, fullNameOut: string, loglevel: string = 'error'): { stderr: string, cmderr: string, isMultilineSrt: boolean; } | undefined {
        // -y is to overwrite destination file.
        // -loglevel quiet is to reduce console output, but still will show errors. (alternatives: -nostats -hide_banner).
        // if file already has subtitles it will overwrite existing, i.e. not duplicate. actually it will skip the new one.
        // TODO: We may run it again to get nice error message <- done

        // If error is: "<filename>.srt: Invalid data found when processing input"
        // Then very likely srt file has extra empty lines, so we can remove all empty lines.

        let cmd =
            `"${FFMPEG_path}" ` +
            `-y -loglevel ${loglevel} ` +
            `-i "${fullNameMp4}" ` +
            `-i "${fullNameSrt}" ` +
            `-c copy -c:s mov_text -metadata:s:s:0 ` +
            `language=eng "${fullNameOut}"`;

        try {
            execSync(cmd, { stdio: ['inherit', 'inherit', 'pipe'] });
        } catch (error) {
            let isMultilineSrt = false;

            const childError: string = (error as any).stderr?.toString() || '';
            if (childError.match(/\.srt: Invalid data found when processing input/)) {
                isMultilineSrt = true;
            }

            const errMsg = chalk.gray(
                removeIndent(`
                ${chalk.yellow('Failed to proceed:')}
                    ${path.basename(fullNameMp4)}
                    ${path.basename(fullNameSrt)}

                ${chalk.yellow('Folder:')}
                ${path.dirname(fullNameSrt)}
                ${chalk.yellow('Command:')}
                ${cmd}`)
                    .replace(/^\r?\n/, ''));

            return {
                stderr: childError,
                cmderr: errMsg,
                isMultilineSrt,
            };
        }
    }

}
