export const enum LineType {
    counter,
    stamp,
    empty,      // empty line
    text,       // anything else
}

export type SingleLineCnt = { // Line meaning of single line content
    type: LineType;
    line: string;
};

export type LineCnt = { // Line meaning and multi line content
    type: LineType;
    lineMulti: string | string[];
};

export type LinesGroup = LineCnt[]; // Timestamp group in closed captions file is timestamp, text lines, and empty line.
