import { notes } from "../utils";
import { msgFnameTooLong, printFilenameLength } from "../5-args/2-app-messages";
import { type MSPair } from "../5-args/4-matched-pairs";

export function checkFilenameMaxLen(targetFolder: string, srt: string, final: MSPair[]) {
    if (srt.length > 248) {
        process.stdout.write(`   \r`);

        notes.flushProcessed();
        printFilenameLength(targetFolder, final);

        throw Error(msgFnameTooLong(srt));
    }
}
