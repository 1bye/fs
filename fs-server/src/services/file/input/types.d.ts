export interface IFileInput {
    size: number;
    type: string;
    name: string | undefined;
    content: string | undefined;

    config: FileInputConfig;

    getPath(): string;
    getHTTPPath(): string;
    getFileName(withoutExtension: boolean): string;
    getDirectoryPath(): string;
    getExtension(): string;
    getType(): string;
    getRelativePath(): string;
    getContent(): Promise<string>;

    delete(params: IFileInputDeleteParams): Promise<void>;
}

export interface IFileInputDeleteParams {
    removeWithDir: boolean;
}

export interface FileInputConfig {
    pathToFile: string;
    content?: string;
}