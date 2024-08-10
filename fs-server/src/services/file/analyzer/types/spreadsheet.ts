import { FileAnalyzerTypeConfig, IFileAnalyzerType } from "@services/file/analyzer/types";
import * as fs from "node:fs/promises";
import { FileAnalyzerOutput } from "@services/file/analyzer/output";
import { FileBaseType } from "@services/file/analyzer/types/base";
import { FileInput } from "@services/file/input";
import * as XLSX from "xlsx";

export class FileAnalyzerSpreadsheetType extends FileBaseType implements IFileAnalyzerType {
    config: FileAnalyzerTypeConfig;

    fileExtensions: string[] = [".xls", ".xlsx", ".xlsm", ".xlsb", ".xltx", ".xltm"];
    fileTypes: string[] = ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];

    constructor(config: FileAnalyzerTypeConfig) {
        super(config);
        this.config = config;
    }

    private async readSpreadsheet(filePath: string): Promise<string> {
        const buffer = await fs.readFile(filePath);
        const workbook = XLSX.read(buffer, { type: "buffer" });

        let content = '';
        workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            content += XLSX.utils.sheet_to_txt(sheet) + "\n"; // Append sheet content with new line
        });

        return content;
    }

    async run() {
        const file = this.config.file;
        let content: string = "";

        content = await this.readSpreadsheet(file.getPath());

        return new FileAnalyzerOutput({
            file: new FileInput({
                pathToFile: file.getFileName(),
                content
            })
        });
    }
}
