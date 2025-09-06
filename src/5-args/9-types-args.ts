export type Targets = {
    files: string[];    // resolved fully qualified filenames
    dirs: string[];     // resolved fully qualified dir names
};

export type AppOptions = {
    preserve: boolean;  // keep subtitle files after successful merge.
    keepOrg: boolean;   // corrupted subtitle files will not be fixed if preserve option is set to true.
}
