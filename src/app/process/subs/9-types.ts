export const enum LineType {
    counter,
    stamp,
    empty,      // empty line
    text,       // anything else
}

export type SingleLineMeaning = {
    type: LineType;
    line: string;
};

export type LineMeaning = {
    type: LineType;
    lineMulti: string | string[];
};
