import chalk from 'chalk';
let cfg = require('../package.json');

export async function exitProcess(exitCode: number, msg: string): Promise<void> {
    async function pressAnyKey(msg: string = '\nPress any key ...') {
        return new Promise(resolve => {
            if (process.stdin.isTTY) {
                console.log(msg);

                process.stdin.setRawMode(true);
                process.stdin.resume();
                process.stdin.on('data', resolve);
            }
            else {
                console.log(' ');
                resolve(void 0);
            }
        });
    }

    console.log(msg);
    await pressAnyKey();
    process.exit(exitCode);
}

interface ErrorArgs extends Error {
    args: boolean;
}

export function newErrorArgs(msg: string): ErrorArgs {
    let error = new Error(msg) as ErrorArgs;
    error.args = true;
    return error;
}

export function help() {
    let help = `
${chalk.cyan('mergesubs')} utility will combine .SRT subtitles with .MP4 files inside specified folders..
Version ${cfg.version}
Usage: mergesubs <file(s).mp4> | <folder(s)>`;
    console.log(help);
}

export namespace notes {
    let messages: string[] = []; // messages will be shown if any warnings happen.
    let processed: string[] = []; // processed will be shown if mergesubs processed more then one folder.

    export function add(note: string): void {
        messages.push(note);
    }

    export function addProcessed(note: string): void {
        processed.push(note);
    }

    export function buildMessage(): string {
        let p = processed.length > 1 ? chalk.blueBright(`Processed:\n${processed.join('\n')}\n`) : '';
        let s = messages.length ? chalk.yellow(`\nNotes:\n${messages.join('\n')}\n`) : '';
        let f = `${p}${s}`;
        return f ? `mergesubs finished\n\n${f}` : '';
    }

    export function willShow(): boolean {
        return processed.length > 1 || !!messages.length;
    }

    export async function show(): Promise<void> {
        let final = buildMessage();
        if (final) {
            await exitProcess(0, final);
        }
    }
} //namespace notes
