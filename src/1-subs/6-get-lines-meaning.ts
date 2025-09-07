import { LineTypes, type SingleLineCnt } from "./9-types";

export function getLinesMeaning(lines: string[]): SingleLineCnt[] {
    const linesMeaning = lines.map(getLineMeaning);
    linesMeaning.forEach(fixStartDotText); //TODO: this can be controlled by CLI, butit's OK for now.
    return linesMeaning;
}

function getLineMeaning(line: string): SingleLineCnt {
    line = line.trim();
    const type =
        line === ''
            ? LineTypes.empty
            : line.match(regCcCounter)
                ? LineTypes.counter
                : line.match(reg2ItemsLine) || line.match(reg3ItemsLine)
                    ? LineTypes.stamp
                    : line.match(extraMarkup)
                        ? LineTypes.empty
                        : LineTypes.text;
    return { type, line };
}

function fixStartDotText(lineMeaning: SingleLineCnt) {
    if (lineMeaning.type === LineTypes.text) {
        const firstCh = lineMeaning.line?.charAt(0);
        const removeFirstCh = firstCh === '\u202B'; // || firstCh === '?' //right-to-left embedding (U+202B) //i.e. "‫.Both projects" -> "Both projects."
        removeFirstCh && (lineMeaning.line = lineMeaning.line.substring(1));
    }
}

const extraMarkup = /^Kind:|^Language:/;
const regCcCounter = /^\s*\d{1,5}\s*$/g;
const reg2ItemsLine = /(\d{2}:\d{2})[\.,](\d{3}\s+)-->(\s+\d{2}:\d{2})[\.,](\d{3}\s*)/g;
const reg3ItemsLine = /(\d{2}:\d{2}:\d{2})[\.,](\d{3}\s+)-->(\s+\d{2}:\d{2}:\d{2})[\.,](\d{3}\s*)/g;
