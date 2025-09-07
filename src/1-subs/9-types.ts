export const LineTypes = {
    counter: '#',    // line counter
    stamp: 't',      // timestamp
    empty: 'e',      // empty line
    text: 'l',       // anything else as line of text
} as const;

export type LineType = typeof LineTypes[keyof typeof LineTypes];

export type SingleLineCnt = { // Line meaning of single line content
    type: LineType;
    line: string;
};

export type LineCnt = { // Line meaning and multi line content
    type: LineType;
    lineMulti: string | string[];
};

export type LinesGroup = LineCnt[]; // Timestamp group in closed captions file is timestamp, text lines, and empty line.
