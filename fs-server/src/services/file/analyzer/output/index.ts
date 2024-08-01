import { FileAnalyzerFile, FileAnalyzerOutputConfig, IFileAnalyzerOutput } from "@services/file/analyzer/output/types";

export class FileAnalyzerOutput implements IFileAnalyzerOutput {
    config: FileAnalyzerOutputConfig;

    constructor(config: FileAnalyzerOutputConfig) {
        this.config = config;
    }

    getFile(): FileAnalyzerFile {
        return this.config.file;
    }
}