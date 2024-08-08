import { FileAnalyzerOutputConfig, IFileAnalyzerOutput } from "@services/file/analyzer/output/types";
import { FileInput } from "@services/file/input";

export class FileAnalyzerOutput implements IFileAnalyzerOutput {
    config: FileAnalyzerOutputConfig;

    constructor(config: FileAnalyzerOutputConfig) {
        this.config = config;
    }

    getFile(): FileInput {
        return this.config.file;
    }
}