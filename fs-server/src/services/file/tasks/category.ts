import { FileAnalyzerTaskConfig, IFileAnalyzerTask } from "./types";
import { PromptTemplate } from "@langchain/core/prompts";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { generateTree } from "@utils/tree";
import googleConfig from "@config/google.config";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export class FileAnalyzerAutoCategoryTask implements IFileAnalyzerTask {
    config: FileAnalyzerTaskConfig;

    constructor(config: FileAnalyzerTaskConfig) {
        this.config = config;
    }

    tool() {
        return tool(
            (_) => {
                return "Moves file to specified folder";
            },
            {
                name: "move_file",
                description:
                    "Moves file to specified folder",
                schema: z.object({
                    fileName: z.string().describe("File path with name to move"),
                    destination: z.string().describe("File folder destination"),
                })
            }
        );
    }

    async run() {
        const chat = this.config?.chat ?? new ChatGoogleGenerativeAI({
            temperature: 0.7,
            model: "gemini-1.5-pro",
            apiKey: googleConfig.genAI.apiKey
        }).bind({
            tools: [this.tool()]
        })

        const prompt = PromptTemplate.fromTemplate(`You are an AI tasked with organizing files into a hierarchical folder structure. For each file provided, you need to analyze its content and decide the most appropriate folder to place it in. If a suitable folder does not exist, create it. Finally, move the file to the chosen folder and update the folder structure accordingly.

Here is the current folder structure:

{folder_structure}

Here is the details of the file:

{file_details}

Here is the content of the file:

{file_content}

Perform the following tasks:
1. Analyze the content of the file and determine its category.
2. Search the existing folder structure for an appropriate folder.
3. If no appropriate folder exists, create one in a logical location.
4. Move the file to the chosen folder.
5. Update and display the new folder structure with the file moved to its new location.
6. Use function calling to move files and create folders
`)

        const output = await prompt.pipe(chat).invoke({
            file_content: this.config.file.content,
            file_details: `File name: ${this.config.file.name}`,
            folder_structure: generateTree(this.config.fsTree, {
                showFiles: false,
                showFolders: true
            })
        })

        return output;
    }
}