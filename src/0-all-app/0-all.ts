import { type Targets } from "../5-args";
import { newErrorArgs } from "../utils";
import { handleFolders } from "./1-handle-folders";
import { handleFiles } from "./2-handle-files";

export async function processArgs(targets: Targets) {
    if (targets.files.length) {
        handleFiles([...targets.files, ...targets.dirs]);
    } else if (targets.dirs.length) {
        handleFolders(targets.dirs);
    } else {
        throw newErrorArgs(`Specify at leats one folder or files name to process`);
    }
}
