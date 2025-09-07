import { newErrorArgs } from "../utils";

export function handleFiles(filesToRar: string[]): void {
    // TOOO: Check: all files and folders should be inside the same folder (although it isn't possible with drag&drop).
    throw newErrorArgs('Separate handling of filenames has not yet been implemented');

    // 0. Simulate rardir behaviour. Files should be in the same folder.
    /*
        let root = path.dirname(filesToRar[0]);
        let files = filesToRar.map(_ => path.basename(_));
        let fnameRar = path.join(root, 'tm.rar');

        if (exist(fnameRar)) { // If tm.rar exist then use shift+drag to move into rar.
            notes.add(`--- INFO: tm.rar already exist here:\n    b:${root}`);
            return;
        }

        // Create dirs.txt and add to tm.rar.

        appUtils.createFileMp4WithSrt(fnameRar, root, files);
    */
}
