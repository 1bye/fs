import { AITaskConfig, AITaskFileConfig, AITaskRunParams, IAITask } from "./types";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { FSTreeRoot, generateTree } from "@utils/tree";
import { AISuggestion } from "@services/ai/suggestion";
import type { ToMutateMap } from "@services/etc/mutate";
import googleConfig from "@config/google.config";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import path from "node:path";

export class AIAutoMoveTask implements IAITask {
    name: string = "autoMove";
    config: AITaskConfig;

    constructor(config: AITaskConfig) {
        this.config = config;
    }

    async run(params?: AITaskRunParams) {
        const chat = this.config?.chat ?? new ChatGoogleGenerativeAI({
            temperature: 0.1,
            model: "gemini-1.5-flash",
            apiKey: googleConfig.genAI.apiKey
            // location: "us-central1",
            // location: "europe-west3",
        }).withStructuredOutput(z.object({
            filePath: z.string().describe("File path to move"),
            destination: z.string().describe("File destination to move"),
            resolvedPath: z.string().describe("File path after moving to new destination"),
        }), {
            name: "moveFile"
        });

        const mut = this.config.mutate;

        const { file, fsTree } = mut.toObject();

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

`)

        const output = await chat.invoke([
            ["system", "You are a helpful assistant"],
            ["human", await prompt.format({
                file_details: `File name: ${file.name}, File Path: ${path.dirname(file.name as string ?? "")}`,
                folder_structure: typeof fsTree === "string"
                    ? fsTree
                    : generateTree(fsTree, {
                        showFiles: false,
                        showFolders: true
                    }),
                file_content: await file.getContent(),
            })]
        ]) as {
            filePath: string;
            destination: string;
            resolvedPath: string;
        };

        await params?.mutateParam?.(["file", "name"], output.resolvedPath);

        return [
            new AISuggestion({
                suggestion: {
                    type: "storage",
                    task: "moveFile",
                    args: {
                        to: output.destination,
                        from: output.filePath
                    }
                }
            })
        ];
    }
}