export interface IFileInput {
    readonly size: number;
    readonly type: string;
    readonly name: string | undefined;

    config: FileInputConfig;

    getPath(): string;
    getHTTPPath(): string;
    getFileName(withoutExtension: boolean): string;
    getDirectoryPath(): string;
    getExtension(): string;
    getType(): string;
    getRelativePath(): string;
}

export interface FileInputConfig {
    pathToFile: string;
}