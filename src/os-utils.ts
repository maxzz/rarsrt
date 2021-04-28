import path from 'path';
import fs from 'fs';

export function exist(name: string): fs.Stats | undefined {
    try {
        return fs.statSync(name);
    } catch (e) {
    }
}

export function toUnix(fileName: string): string {
    const double = /\/\//;
    let res: string = fileName.replace(/\\/g, '/');
    while (res.match(double)) {
        res = res.replace(double, '/');
    }
    return res;
}

export function toWindows(fileName: string): string {
    let res: string = fileName.replace(/\//g, '/');
    res = res.replace(/\//g, '\\');
    return res;
}

export namespace fnames {

    export const enum extType {
        unk,     // Not interested for us.
        empty,   // No file extension at all.

        rar,     // '.rar'
        zip,     // '.zip'
        tor,     // '.torrent'
        url,     // '.url'
        mht,     // '.mht'
        pdf,     // '.pdf'
        unity,   // '.unitypackage'
        txt,     // '.txt'
        srt,     // '.srt' subtitles
        avi,     // '.avi' video
        mp4,     // '.mp4' video
        mkv,     // '.mkv' video
    }

    export type fileItem = { // This is only file name wo/ path and extension, plus type of file extension.
        short: string;      // Original filename wo/ path.
        name: string;       // File name wo/ extension and path.
        ext: extType;       // File extension type of this file name.
    }

    let extTypes = new Map([
        ['.rar',          extType.rar],
        ['.zip',          extType.zip],
        ['.torrent',      extType.tor],
        ['.url',          extType.url],
        ['.mht',          extType.mht],
        ['.pdf',          extType.pdf],
        ['.unitypackage', extType.unity],
        ['.txt',          extType.txt],
        ['.srt',          extType.srt],
        ['.vtt',          extType.srt],
        ['.avi',          extType.avi],
        ['.mp4',          extType.mp4],
        ['.mkv',          extType.mkv],
    ]);

    export function castFileExtension(ext: string): extType {
        ext = ext.trim();
        if (ext === '.' || ext === '') {
            return extType.empty;
        }
        return extTypes.get(ext.toLowerCase()) || extType.unk;
    }
    
} //namespace fnames

export function removeIndent(src: string, all?: boolean): string {
    // 1. if defined all then remove all indentation from each line
    if (all) {
        return src.replace(/^[^\S\n]+/gm, '');
    }
    // 2. remove the shortest leading indentation from each line
    const match = src.match(/^[^\S\n]*(?=\S)/gm);
    match && !match[0] && match.shift(); // remove the first line if empty
    const indent = match && Math.min(...match.map(line => line.length));
    if (indent) {
        const regexp = new RegExp(`^.{${indent}}`, 'gm');
        return src.replace(regexp, '');
    }
    return src;
}
