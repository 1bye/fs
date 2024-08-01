import { FileAnalyzerTypeConfig, IFileAnalyzerType } from "@services/file/analyzer/types";

export class FileAnalyzerTextType implements IFileAnalyzerType {
    config: FileAnalyzerTypeConfig;

    fileExtensions: string[] = ["txt"];
    fileTypes: string[] = ["text/plain"];

    constructor(config: FileAnalyzerTypeConfig) {
        this.config = config;
    }

    async process() {

    }
}


