import { FileAnalyzerTypeConfig, IFileAnalyzerType } from "@services/file/analyzer/types";
import * as fs from "node:fs/promises";
import { FileAnalyzerOutput } from "@services/file/analyzer/output";
import { FileBaseType } from "@services/file/analyzer/types/base";
import { FileInput } from "@services/file/input";
import mammoth from "mammoth";
// @ts-ignore
import pdf from "pdf-parse/lib/pdf-parse";

export class FileAnalyzerDocumentType extends FileBaseType implements IFileAnalyzerType {
    config: FileAnalyzerTypeConfig;

    fileExtensions: string[] = [".docx", ".doc", ".pdf"];
    fileTypes: string[] = ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/pdf"];

    constructor(config: FileAnalyzerTypeConfig) {
        super(config);
        this.config = config;
    }

    private async readDocx(filePath: string): Promise<string> {
        const buffer = await fs.readFile(filePath);
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    }

    private async readPdf(filePath: string): Promise<string> {
        const buffer = await fs.readFile(filePath);
        const data = await pdf(buffer);
        return data.text;
    }

    async run() {
        const file = this.config.file;
        let content: string = "";

        if (file.getExtension() === ".docx" || file.getExtension() === ".doc") {
            content = await this.readDocx(file.getPath());
        } else if (file.getExtension() === ".pdf") {
            content = await this.readPdf(file.getPath());
        } else {
            throw new Error("Unsupported file format.");
        }

        return new FileAnalyzerOutput({
            file: new FileInput({
                pathToFile: file.getFileName(),
                content
            })
        });
    }
}
