export const LineTypes = {
    counter: '#',    // line counter
    stamp: 't',      // timestamp
    empty: 'e',      // empty line
    text: 'l',       // anything else as line of text
} as const;

export type LineType = typeof LineTypes[keyof typeof LineTypes];

/**
 * ```
 * // One item of parsed source file content:
 * [
 *      {type: '#', line: '1'}
 *      {type: 't', line: '00:00:00,180 --> 00:00:00,510'}
 *      {type: 'l', line: 'Okay.'}
 *      {type: 'e', line: ''}
 *      {type: '#', line: '2'}
 *      {type: 't', line: '00:00:00,510 --> 00:00:05,070'}
 * ]
 * ```
 */
export type SingleLineCnt = { // Line meaning of single line content
    type: LineType;
    line: string;
};

/**
 * ```
 * [
 *    {type: '#', lineMulti: '1'}
 *    {type: 't', lineMulti: '00:00:00,180 --> 00:00:00,510'}
 *    {type: 'l', lineMulti: 'Okay.'}
 * ]
 *    ```
 */
export type LineCnt = { // Line meaning and multi line content
    type: LineType;
    lineMulti: string | string[];
};

/**
 * ```
 * [
 *    // Grouped lines
 *    [
 *       {type: '#', lineMulti: '1'}
 *       {type: 't', lineMulti: '00:00:00,180 --> 00:00:00,510'}
 *       {type: 'l', lineMulti: 'Okay.'}
 *    ], [
 *       {type: '#', lineMulti: '2'}
 *       {type: 't', lineMulti: '00:00:00,510 --> 00:00:05,070'}
 *       {type: 'l', lineMulti: 'So at this point'}
 *    ]
 * ]
 *    ```
 */
export type LinesGroup = LineCnt[]; // Timestamp group in closed captions file is timestamp, text lines, and empty line.
