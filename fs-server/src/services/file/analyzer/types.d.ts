import { FileInput } from "@services/file/input";

export type AvailableAnalyzerTasks = "autoCategorize" | "autoTag" | "autoName";

export interface IFileAnalyzer {

}

export interface FileAnalyzerConfig {
    file: FileInput;
    tasks: AvailableAnalyzerTasks[];
}

export interface FileAnalyzerTypeConfig extends FileAnalyzerConfig {

}

export interface IFileAnalyzerType {
    config: FileAnalyzerTypeConfig;
    fileExtensions: string[];
    fileTypes: string[];
}