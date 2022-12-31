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

export function replaceExt(fname: string, newExt: string) {
    return path.join(path.dirname(fname), path.basename(fname, path.extname(fname)) + newExt);
}

export function filterByExt(fnames: string[], ext: string): string[] {
    return fnames.filter((fname) => path.extname(fname).toLowerCase() === ext);
}

export namespace fnames {

    export const enum ExtType {
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
        vtt,     // '.vtt' subtitles
        avi,     // '.avi' video
        mp4,     // '.mp4' video
        mkv,     // '.mkv' video
    }

    export type fileItem = { // This is only file name wo/ path and extension, plus type of file extension.
        short: string;      // Original filename wo/ path.
        name: string;       // File name wo/ extension and path.
        ext: ExtType;       // File extension type of this file name.
    }

    let extTypes = new Map([
        ['.rar',          ExtType.rar],
        ['.zip',          ExtType.zip],
        ['.torrent',      ExtType.tor],
        ['.url',          ExtType.url],
        ['.mht',          ExtType.mht],
        ['.pdf',          ExtType.pdf],
        ['.unitypackage', ExtType.unity],
        ['.txt',          ExtType.txt],
        ['.srt',          ExtType.srt],
        ['.vtt',          ExtType.vtt],
        ['.avi',          ExtType.avi],
        ['.mp4',          ExtType.mp4],
        ['.mkv',          ExtType.mkv],
    ]);

    export function castFileExtension(ext: string): ExtType {
        ext = ext.trim();
        if (ext === '.' || ext === '') {
            return ExtType.empty;
        }
        return extTypes.get(ext.toLowerCase()) || ExtType.unk;
    }
    
} //namespace fnames
