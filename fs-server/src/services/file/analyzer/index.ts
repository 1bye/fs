import { FileAnalyzerConfig, IFileAnalyzer } from "./types";

export class FileAnalyzer implements IFileAnalyzer {
    config: FileAnalyzerConfig;

    constructor(config: FileAnalyzerConfig) {
        this.config = config;
    }

    analyze() {

    }
}