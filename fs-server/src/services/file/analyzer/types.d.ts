import { FileInput } from "@services/file/input";
import { FileAnalyzerOutput } from "@services/file/analyzer/output";

export interface IFileAnalyzer {

}

export interface FileAnalyzerConfig {
    file: FileInput;
}

export interface FileAnalyzerTypeConfig extends FileAnalyzerConfig {

}

export interface IFileAnalyzerType {
    config: FileAnalyzerTypeConfig;
    fileExtensions: string[];
    fileTypes: string[];

    run(): Promise<FileAnalyzerOutput>;
}