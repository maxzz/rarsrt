import fs from "fs";
import path from "path";
import { exist, notes, replaceExt } from "../utils";
import { msgFnameTooLong, printFilenameLength } from "../5-args/2-app-messages";
import { type AppOptions } from "../5-args/9-types-args";
import { type MSPair } from "../5-args/4-matched-pairs";
import { type ConvertSubtitlesResult, convertSubtitles } from "../1-subs";

export function checkFilenameMaxLen(targetFolder: string, srt: string, final: MSPair[]) {
    if (srt.length > 248) {
        process.stdout.write(`   \r`);

        notes.flushProcessed();
        printFilenameLength(targetFolder, final);

        throw Error(msgFnameTooLong(srt));
    }
}
