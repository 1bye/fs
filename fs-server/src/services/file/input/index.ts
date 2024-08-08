import path, { basename, dirname, parse, relative } from "node:path";
import { FileInputConfig, IFileInput, IFileInputDeleteParams } from "./types";
import { isValidURL } from "@utils/url";
import { rm } from "node:fs/promises"

export class FileInput implements IFileInput {
    config: FileInputConfig;

    size: number;
    type: string;
    name: string | undefined;
    content: string | undefined;

    constructor(config: FileInputConfig) {
        this.config = config;

        const file = Bun.file(config.pathToFile);

        this.content = this.config.content;
        this.size = file.size;
        this.type = file.type;
        this.name = file.name;
    }

    /**
     * Returns path to video, it can be as file-based or http based
     */
    getPath(): string {
        return this.config.pathToFile;
    }

    /**
     * Returns path, but validates if it's accessible over internet (http)
     */
    getHTTPPath(): string {
        const path = this.config.pathToFile;

        if (!isValidURL(path)) {
            throw new Error("Invalid HTTP URL");
        }

        return this.config.pathToFile;
    }

    /**
     * Returns the directory path of the file without the file name.
     */
    getDirectoryPath(): string {
        const filePath = this.config.pathToFile;
        return dirname(filePath);
    }

    /**
     * Returns the name of the file from the path, optionally without the extension.
     */
    getFileName(withoutExtension: boolean = false): string {
        const filePath = this.config.pathToFile;
        if (withoutExtension) {
            return parse(filePath).name;
        } else {
            return basename(filePath);
        }
    }

    getExtension() {
        const filePath = this.config.pathToFile;
        return parse(filePath).ext;
    }

    getType(): string {
        return this.type.split(";")[0];
    }

    /**
     * Returns the relative path from the current directory to the file.
     */
    getRelativePath(): string {
        const filePath = this.config.pathToFile;
        return relative(process.cwd(), filePath);
    }

    /**
     * Returns file content as text
     */
    async getContent(): Promise<string> {
        return this.content ?? await Bun.file(this.getPath()).text();
    }

    async delete({ removeWithDir }: IFileInputDeleteParams) {
        const file = Bun.file(this.config.pathToFile);

        if (await file.exists()) {
            await rm(
                removeWithDir
                    ? path.dirname(this.config.pathToFile)
                    : this.config.pathToFile,
                {
                    force: true,
                    recursive: true
                })
        }
    }
}