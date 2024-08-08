import { FileAnalyzerTypeConfig, IFileAnalyzerType } from "@services/file/analyzer/types";
import { FileAnalyzerOutput } from "@services/file/analyzer/output";
import { FileInput } from "@services/file/input";

export class FileBaseType implements IFileAnalyzerType {
    config: FileAnalyzerTypeConfig;
    fileTypes: string[] = [];
    fileExtensions: string[] = [];

    constructor(config: FileAnalyzerTypeConfig) {
        this.config = config;
    }

    async run(): Promise<FileAnalyzerOutput> {
        return new FileAnalyzerOutput({
            file: new FileInput({
                pathToFile: "blank_file.name",
                content: "Blank file"
            })
        })
    }
}