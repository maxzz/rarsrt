import path from 'path';
import fs from 'fs';

export namespace OsStuff {

    export type FileItem = {
        short: string;      // filename wo/ path
        btime: Date;        // file created (birthtime) timestamp
        mtime?: Date;       // file data modified timestamp; present if different from btime
        size: number;       // file size
    };

    export type FolderItem = {
        name: string;       // Folder full name
        files: FileItem[];  // Short filenames i.e. wo/ path.
        subs: FolderItem[]; // Sub-folders.
    };

    function recursivelyCollectFiles(dir: string, rv: FolderItem, recursive: boolean): void {
        rv.files.push(...fs.readdirSync(dir).map((shortname) => {
            const fullname = path.join(dir, shortname);
            const st = fs.statSync(fullname);
            if (st.isDirectory()) {
                if (recursive) {
                    let newFolder: FolderItem = {
                        name: fullname,
                        files: [],
                        subs: [],
                    };
                    recursivelyCollectFiles(fullname, newFolder, recursive);
                    if (newFolder.files.length || newFolder.subs.length) {
                        rv.subs.push(newFolder);
                    }
                }
            } else if (st.isFile()) {
                let newFile: FileItem = {
                    short: shortname,
                    btime: st.birthtime,
                    ...(st.birthtime !== st.mtime && { mtime: st.mtime }),
                    size: st.size,
                };
                return newFile;
            }
        }).filter(Boolean));
    }

    export function collectDirItems(dir: string): FolderItem {
        let rv: FolderItem = {
            name: dir,
            files: [],
            subs: [],
        };
        recursivelyCollectFiles(dir, rv, true);
        return rv;
    }

} //namespace OsStuff
