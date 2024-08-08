import { FileAnalyzerTypeConfig, IFileAnalyzerType } from "@services/file/analyzer/types";
import * as fs from "node:fs/promises";
import { FileAnalyzerOutput } from "@services/file/analyzer/output";
import { FileBaseType } from "@services/file/analyzer/types/base";
import { FileInput } from "@services/file/input";

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

        let content: string = "";

        if (file.size > 3000) {
            // currently only for .txt files
            const headerSize = Math.min(Math.ceil(file.size * 0.1), 1000);

            const buffer = Buffer.alloc(headerSize);
            const fileHandle = await fs.open(file.getPath(), "r");
            await fileHandle.read(buffer, 0, headerSize, 0);
            await fileHandle.close();

            content = buffer.toString("utf8");
        } else {
            content = await Bun.file(file.getPath()).text();
        }

        return new FileAnalyzerOutput({
            file: new FileInput({
                pathToFile: file.getFileName(),
                content
            })
        })
    }
}


