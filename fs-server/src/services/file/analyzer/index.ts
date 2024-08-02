import { FileAnalyzerConfig, IFileAnalyzer, IFileAnalyzerType } from "./types";

export class FileAnalyzer implements IFileAnalyzer {
    config: FileAnalyzerConfig;
    registeredTypes: IFileAnalyzerType[] = [];

    constructor(config: FileAnalyzerConfig) {
        this.config = config;
    }

    registerType(type: IFileAnalyzerType | IFileAnalyzerType[]) {
        this.registeredTypes.push(...Array.isArray(type) ? type : [type])
    }

    async analyze() {
        const file = this.config.file;

        for (const type of this.registeredTypes) {
            if (type.fileTypes.includes(file.getType()) || type.fileExtensions.includes(file.getExtension())) {
                return await type.run();
            }
        }

        throw new Error("Failed to analyze file, anonymous file type");
    }
}