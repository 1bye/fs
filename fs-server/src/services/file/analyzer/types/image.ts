import { FileAnalyzerTypeConfig, IFileAnalyzerType } from "@services/file/analyzer/types";
import { FileAnalyzerOutput } from "@services/file/analyzer/output";
import { FileBaseType } from "@services/file/analyzer/types/base";
import { FileInput } from "@services/file/input";
import googleConfig from "@config/google.config";
import ImageExtensionTypes from "@etc/json/image-ext-types.json";
import sharp from "sharp";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export class FileAnalyzerImageType extends FileBaseType implements IFileAnalyzerType {
    config: FileAnalyzerTypeConfig;

    fileExtensions: string[] = [".png", ...ImageExtensionTypes];
    fileTypes: string[] = ["image/png"];

    constructor(config: FileAnalyzerTypeConfig) {
        super(config);
        this.config = config;
    }

    private async getBase64Image() {
        const buffer = await sharp(this.config.file.getPath())
            .png() // Convert to PNG format
            .toBuffer();

        // await Bun.write(`${serverConfig.tmpFolder}/p.png`, buffer);

        // Encode the PNG buffer to Base64
        const base64Image = buffer.toString("base64");

        // Optionally, create a data URI
        return `data:image/png;base64,${base64Image}`;
    }

    async run() {
        const file = this.config.file;

        let content: string = "";

        const chat = new ChatGoogleGenerativeAI({
            temperature: 0.1,
            model: "gemini-1.5-pro",
            apiKey: googleConfig.genAI.apiKey
        });

        const base64Image = await this.getBase64Image();

        const output = await chat.invoke([
            ["system", "You are a helpful assistant"],
            ["human", [{
                type: "text",
                text: `"What happens in this image?"

Describe the key elements and actions visible.
Identify the main subjects or objects.
Note any relevant context or events depicted.`
            }, {
                type: "image_url",
                image_url: {
                    url: base64Image
                }
            }]]
        ])

        content = output.content.toString();

        return new FileAnalyzerOutput({
            file: new FileInput({
                pathToFile: file.getFileName(),
                content
            })
        })
    }
}


