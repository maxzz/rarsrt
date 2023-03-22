export const enum ConvertAction {
    convertToSrt,   // convert hh:mm:ss.ms to hh:mm:ss,ms fix hh, and extra conter
    fixAndKeepVtt,  // keep vtt, but fix mm:ss.ms to hh:mm:ss.ms, and extra conter
}

export type ConvertResult = {
    newContent: string;
    hasFixes: boolean;
};
