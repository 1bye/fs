export interface IFileAnalyzerOutput {
    config: FileAnalyzerOutputConfig;
    getFile(): FileAnalyzerFile;
}

export interface FileAnalyzerFile {
    name: string;
    content: string;
}

export interface FileAnalyzerOutputConfig {
    file: FileAnalyzerFile
}

