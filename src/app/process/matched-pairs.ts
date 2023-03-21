import { fnames } from "../../utils/utils-os";
import { OsStuff } from "../../utils/utils-os-stuff";

export type MSPair = {  // mp4 and srt pair
    mp4?: string;       // short filename.mp4
    srt?: string;       // short filename[(_en| English)](.srt|.vtt)
};

export function getMSPairs(targetFolder: string): MSPair[] {
    // 1. Get folders and files inside the target folder.
    let filesAndFolders: OsStuff.FolderItem = OsStuff.collectDirItems(targetFolder);

    // 2. Get what we have inside this folder.
    type FItem = OsStuff.FileItem & { ext: fnames.ExtType; };

    let fItems: FItem[] = filesAndFolders.files.map((_: OsStuff.FileItem) => ({ ..._, ext: fnames.castFileExtension(path.extname(_.short)) }));

    let msPairs: Record<string, MSPair> = {}; // short filename wo/ ext -> { mp4: short filename.mp4, srt: short filename(.srt|.vtt) }

    fItems.forEach((item: FItem) => {
        const base = path.parse(item.short).name;

        if (item.ext === fnames.ExtType.mp4) {
            const current = (msPairs[base] || (msPairs[base] = {}));
            current.mp4 = item.short;
        }
        else if (item.ext === fnames.ExtType.srt || item.ext === fnames.ExtType.vtt) {
            const clean = cleanUpSubName(base);
            const current = (msPairs[clean] || (msPairs[clean] = {}));
            current.srt = item.short;
        }
    }); //TODO: we can first iteration find all mp4 and then match base againts sub title filenames.

    const completePairs: MSPair[] = (Object.values(msPairs)).filter((pair) => pair.mp4 && pair.srt);
    return completePairs;

    function cleanUpSubName(name: string) {
        // Cases: 'name English.srt/vtt'; 'name.en.srt/vtt'; 'name_en.srt/vtt' but not 'name French.vtt'
        const clean = name.replace(/ English$/i, '').replace(/\.en$/, '').replace(/_en$/i, '');
        return clean;
    }
}
