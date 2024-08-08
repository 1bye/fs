import { FileInput } from "@services/file/input";

export interface IFileAnalyzerOutput {
    config: FileAnalyzerOutputConfig;
    getFile(): FileInput;
}

export interface FileAnalyzerOutputConfig {
    file: FileInput;
}

