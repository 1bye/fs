import { FileAnalyzerTypeConfig, IFileAnalyzerType } from "@services/file/analyzer/types";

export class FileAnalyzerBaseType implements IFileAnalyzerType {
    config: FileAnalyzerTypeConfig;
    fileTypes: string[] = [];
    fileExtensions: string[] = [];

    constructor(config: FileAnalyzerTypeConfig) {
        this.config = config;
    }


}