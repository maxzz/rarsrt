import chalk from "chalk";
import { EOL } from "os";
import { type LinesGroup, LineType } from "./9-types";

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
                type === LineType.counter
                    ? chalk.cyan('numbr')
                    : type === LineType.stamp
                        ? chalk.yellow('stamp')
                        : type === LineType.empty
                            ? '     '
                            : type === LineType.text
                                ? chalk.gray(' text')
                                : chalk.red('?');

            const txt = typeof line === 'string' ? line : `\n${line.join(EOL)}`;
            console.log(`${prefix}: ${txt}`);
        }
    );
}
