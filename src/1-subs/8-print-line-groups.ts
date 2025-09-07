import chalk from "chalk";
import { EOL } from "os";
import { type LinesGroup, LineTypes } from "./9-types";

export function printLineGroups(lineGroups: LinesGroup[]) {
    lineGroups.forEach(
        (group) => {
            console.log(chalk.green('start:'));
            printLineMeanings(group);
        }
    );
}

function printLineMeanings(lineGroup: LinesGroup) {
    lineGroup.forEach(
        ({ lineMulti: line, type }) => {
            const prefix =
                type === LineTypes.counter
                    ? chalk.cyan('numbr')
                    : type === LineTypes.stamp
                        ? chalk.yellow('stamp')
                        : type === LineTypes.empty
                            ? '     '
                            : type === LineTypes.text
                                ? chalk.gray(' text')
                                : chalk.red('?');

            const txt = typeof line === 'string' ? line : `\n${line.join(EOL)}`;
            console.log(`${prefix}: ${txt}`);
        }
    );
}
