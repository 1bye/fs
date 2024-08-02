import { FileAnalyzerTypeConfig, IFileAnalyzerType } from "@services/file/analyzer/types";
import { FileAnalyzerOutput } from "@services/file/analyzer/output";

export class FileBaseType implements IFileAnalyzerType {
    config: FileAnalyzerTypeConfig;
    fileTypes: string[] = [];
    fileExtensions: string[] = [];

    constructor(config: FileAnalyzerTypeConfig) {
        this.config = config;
    }

    async run(): Promise<FileAnalyzerOutput> {
        return new FileAnalyzerOutput({
            file: {
                content: "Blank file",
                name: "blank_file.name"
            }
        })
    }
}