import { LineType, type SingleLineMeaning } from "./9-types";

export function getLinesMeaning(lines: string[]): SingleLineMeaning[] {
    const linesMeaning = lines.map(getLineMeaning);
    fixStartDotTextLinesInPlace(linesMeaning);
    return linesMeaning;

    function getLineMeaning(line: string): SingleLineMeaning {
        line = line.trim();
        const type =
            line === ''
                ? LineType.empty
                : line.match(regCcCounter)
                    ? LineType.counter
                    : line.match(reg2ItemsLine) || line.match(reg3ItemsLine)
                        ? LineType.stamp
                        : line.match(extraMarkup)
                            ? LineType.empty
                            : LineType.text;
        return { type, line };
    }

    function fixStartDotTextLinesInPlace(lineMeaning: SingleLineMeaning[]) {
        function fix(lineMeaning: SingleLineMeaning) {
            if (lineMeaning.type === LineType.text) {
                const first = lineMeaning.line?.charAt(0);
                const removeFirst = first === '\u202B'; // || first === '?' //right-to-left embedding (U+202B) //i.e. "‫.Both projects" -> "Both projects."
                removeFirst && (lineMeaning.line = lineMeaning.line.substring(1));
            }
        }
        lineMeaning.forEach(fix); //TODO: this can be controlled by CLI, but now it's OK.
    }
}

const extraMarkup = /^Kind:|^Language:/;
const regCcCounter = /^\s*\d{1,5}\s*$/g;
const reg2ItemsLine = /(\d{2}:\d{2})[\.,](\d{3}\s+)-->(\s+\d{2}:\d{2})[\.,](\d{3}\s*)/g;
const reg3ItemsLine = /(\d{2}:\d{2}:\d{2})[\.,](\d{3}\s+)-->(\s+\d{2}:\d{2}:\d{2})[\.,](\d{3}\s*)/g;
