import path from 'path';
import { exist } from '../utils/utils-os';
import { newErrorArgs } from '../utils/utils-errors';
import { Targets } from './app-types';
import { OsStuff } from '../utils/utils-os-stuff';

function checkArg(argTargets: string[]): Targets {
    let rv = {
        files: [],
        dirs: [],
    };

    for (let target of argTargets) {
        let current: string = path.resolve(target); // relative to the start up folder
        let st = exist(current);
        if (st) {
            if (st.isDirectory()) {
                rv.dirs.push(current);
            } else if (st.isFile()) {
                rv.files.push(current); // TODO: Check all files should have the same root folder. That is not possible with drag and drop, but still ...
            }
        } else {
            throw newErrorArgs(`Target "${target}" does not exist.`);
        }
    }

    return rv;
}

export function getTargets(): Targets {
    // console.log('args', JSON.stringify(process.argv.slice(2), null, 4));
    // await exitProcess(0, '');

    const args = require('minimist')(process.argv.slice(2), {
    });

    //console.log(`args ${JSON.stringify(args, null, 4)}`);
    //await exitProcess(0, '');

    const targets: Targets = checkArg(args._ || []);

    const isSingleFolderToProcess = targets.dirs.length === 1 && !targets.files.length; // If we have a single top folder (and no top files w/ drag&drop) then check what we have inside.
    if (isSingleFolderToProcess) {
        let rootFolders: OsStuff.FolderItem = OsStuff.collectDirItems(targets.dirs[0]); // one of cases with 'rarsrt .'
        targets.dirs.push(...rootFolders.subs.map((_: OsStuff.FolderItem) => _.name));
    }

    // console.log(`targets ${JSON.stringify(targets, null, 4)}`);
    // await exitProcess(0, '');

    return targets;
}
