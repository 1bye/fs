import { FileAnalyzerTypeConfig, IFileAnalyzerType } from "@services/file/analyzer/types";
import * as fs from "node:fs/promises";
import { FileAnalyzerOutput } from "@services/file/analyzer/output";
import { FileBaseType } from "@services/file/analyzer/types/base";

export class FileAnalyzerTextType extends FileBaseType implements IFileAnalyzerType {
    config: FileAnalyzerTypeConfig;

    fileExtensions: string[] = [".txt"];
    fileTypes: string[] = ["text/plain"];

    constructor(config: FileAnalyzerTypeConfig) {
        super(config);
        this.config = config;
    }

    async run() {
        const file = this.config.file;

        // currently only for .txt files
        const headerSize = Math.min(Math.ceil(file.size * 0.1), 1000);

        const buffer = Buffer.alloc(headerSize);
        const fileHandle = await fs.open(file.getPath(), "r");
        await fileHandle.read(buffer, 0, headerSize, 0);
        await fileHandle.close();

        return new FileAnalyzerOutput({
            file: {
                content: buffer.toString("utf8"),
                name: file.getFileName(),
            }
        })
    }
}


