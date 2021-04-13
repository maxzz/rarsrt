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
