export type Targets = {
    files: string[];    // resolved fully qualified filenames
    dirs: string[];     // resolved fully qualified dir names
};

export type AppOptions = {
    preserve: boolean;  // keep subtitle files after successful merge.
}

export type AppArgs = {
    targets: Targets;
    options: AppOptions;
}
