import { FileAnalyzerTaskConfig, IFileAnalyzerTask } from "@services/file/analyzer/tasks/types";
import { zodToGeminiParameters } from "@langchain/google-vertexai/utils";
import { type GeminiTool } from "@langchain/google-vertexai/types";
import { ChatVertexAI } from "@langchain/google-vertexai";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { generateTree } from "@utils/tree";

export class FileAnalyzerAutoCategoryTask implements IFileAnalyzerTask {
    config: FileAnalyzerTaskConfig;

    constructor(config: FileAnalyzerTaskConfig) {
        this.config = config;
    }

    tool(): GeminiTool {
        const moveFileSchema = z.object({
            file: z.number().describe("File path with name to move"),
            destination: z.number().describe("File folder destination"),
        });

        const createFolderSchema = z.object({
            path: z.number().describe("Path to create folder")
        });

        return {
            functionDeclarations: [{
                name: "move-file",
                description: "Moves file to folder",
                parameters: zodToGeminiParameters(moveFileSchema)
            }, {
                name: "create-folder",
                description: "Creates folder",
                parameters: zodToGeminiParameters(createFolderSchema)
            }]
        }
    }

    async run() {
        const chat = this.config?.chat ?? new ChatVertexAI({
            temperature: 0.7,
            model: "gemini-1.5-flash-001",
        }).bind({
            tools: [this.tool()]
        });

        const prompt = PromptTemplate.fromTemplate(`You are an AI tasked with organizing files into a hierarchical folder structure. For each file provided, you need to analyze its content and decide the most appropriate folder to place it in. If a suitable folder does not exist, create it. Finally, move the file to the chosen folder and update the folder structure accordingly.

Here is the current folder structure:

{folder_structure}

Here is the content of the file:

{file_content}

Perform the following tasks:
1. Analyze the content of the file and determine its category.
2. Search the existing folder structure for an appropriate folder.
3. If no appropriate folder exists, create one in a logical location.
4. Move the file to the chosen folder.
5. Update and display the new folder structure with the file moved to its new location.

Provide the updated file path and the updated folder structure.
`)

        const chain = RunnableSequence.from([
            prompt,
            chat,
            new StringOutputParser()
        ])

        const response = await chain.invoke({
            file_content: this.config.textContent,
            folder_structure: generateTree(this.config.fsTree, {
                showFiles: false,
                showFolders: true
            })
        })

        return response;
    }
}