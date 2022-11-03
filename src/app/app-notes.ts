import chalk from 'chalk';
import { exitProcess } from '../utils/utils-errors';

export namespace notes {
    let messages: string[] = []; // messages will be shown if any warnings happen.
    let processed: string[] = []; // processed will be shown if rarsrt processed more then one folder.

    export function add(note: string): void {
        messages.push(note);
    }

    export function addProcessed(note: string): void {
        processed.push(note);
    }

    export function buildMessage(showFinished: boolean = true): string {
        let p = processed.length > 1 ? chalk.blueBright(`Processed:\n${processed.join('\n')}\n`) : '';
        let s = messages.length ? chalk.yellow(`\nNotes:\n${messages.join('\n')}\n`) : '';
        let f = `${p}${s}`;
        return f ? showFinished ? `rarsrt finished\n\n${f}` : f : '';
    }

    export function flushProcessed(): void {
        let p = processed.length > 1 ? chalk.blueBright(`Processed:\n${processed.join('\n')}`) : '';
        p && console.log(p);
        processed = [];
    }

    export function willShow(): boolean {
        return processed.length > 1 || !!messages.length;
    }

    export async function show(showFinished: boolean = true): Promise<void> {
        let final = buildMessage(showFinished);
        if (final) {
            await exitProcess(0, final);
        }
    }
} //namespace notes
