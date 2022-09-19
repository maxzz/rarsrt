import fs from 'fs';

export namespace osStuff {

    export type fileItem = {
        short: string;      // filename wo/ path
        btime: Date;        // file created (birthtime) timestamp
        mtime?: Date;       // file data modified timestamp; present if different from btime
        size: number;       // file size
    };

    export type folderItem = {
        name: string;       // Folder full name
        files: fileItem[];  // Short filenames i.e. wo/ path.
        subs: folderItem[]; // Sub-folders.
    };

    function collectFiles(dir: string, rv: folderItem, recursive: boolean): void {
        rv.files.push(...fs.readdirSync(dir).map((_) => {
            let fname = path.join(dir, _);
            let st = fs.statSync(fname);
            if (st.isDirectory()) {
                if (recursive) {
                    let newFolder: folderItem = {
                        name: fname,
                        files: [],
                        subs: [],
                    };
                    collectFiles(fname, newFolder, recursive);
                    if (newFolder.files.length || newFolder.subs.length) {
                        rv.subs.push(newFolder);
                    }
                }
            } else if (st.isFile()) {
                let newFile: fileItem = {
                    short: _,
                    btime: st.birthtime,
                    ...(st.birthtime !== st.mtime && { mtime: st.mtime }),
                    size: st.size,
                };
                return newFile;
            }
        }).filter(Boolean));
    }

    export function collectDirItems(dir: string): folderItem {
        let rv: folderItem = {
            name: dir,
            files: [],
            subs: [],
        };
        collectFiles(dir, rv, true);
        return rv;
    }

} //namespace osStuff
