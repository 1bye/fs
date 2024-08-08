import { AITaskConfig, AITaskFileConfig, AITaskRunParams, IAITask } from "./types";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { FSTreeRoot, generateTree } from "@utils/tree";
import { AISuggestion } from "@services/ai/suggestion";
import { ChatVertexAI } from "@langchain/google-vertexai";
import type { ToMutateMap } from "@services/etc/mutate";

export class AIAutoRenameTask implements IAITask {
    name: string = "autoRename";
    config: AITaskConfig;

    constructor(config: AITaskConfig) {
        this.config = config;
    }

    async run(params?: AITaskRunParams) {
        const chat = this.config?.chat ?? new ChatVertexAI({
            temperature: 0.1,
            model: "gemini-1.5-flash",
            location: "europe-west3",
        }).withStructuredOutput(z.object({
            originalName: z.string().describe("Original file name"),
            newName: z.string().describe("New file name after renaming"),
            resolvedPath: z.string().describe("File path after renaming, with new renamed file name"),
            filePath: z.string().describe("File path before renaming, with old file name"),
        }), {
            name: "renameFile"
        });

        const mut = this.config.mutate as ToMutateMap<{
            file: AITaskFileConfig["file"];
            fsTree: FSTreeRoot;
        }>

        const prompt = PromptTemplate.fromTemplate(`You are an AI tasked with renaming files to better reflect their content. For each file provided, you need to analyze its content and decide on a more appropriate, descriptive name. The new name should be consistent with the existing naming conventions.

Here is the current folder structure:

{folder_structure}

Here are the details of the file:

{file_details}

Here is the content of the file:

{file_content}

Perform the following tasks:
1. Analyze the content of the file and determine an appropriate new name.
2. Ensure that the new name is descriptive and follows naming conventions.
3. Provide the new name for the file.
4. And rename it

`)

        const output = await chat.invoke([
            ["system", "You are a helpful assistant"],
            ["human", await prompt.format({
                file_details: `File name: ${mut.get("file").name}, File Path: ${mut.get("file").getPath()}`,
                folder_structure: generateTree(mut.get("fsTree"), {
                    showFiles: false,
                    showFolders: true
                }),
                file_content: await mut.get("file").getContent(),
            })]
        ]) as {
            originalName: string;
            newName: string;
            resolvedPath: string;
            filePath: string;
        };
        console.log(output)
        await params?.mutateParam?.(["file", "name"], output.newName);

        return [
            new AISuggestion({
                suggestion: {
                    type: "storage",
                    task: "renameFile",
                    args: {
                        from: output.filePath,
                        to: output.resolvedPath
                    }
                }
            })
        ];
    }
}
