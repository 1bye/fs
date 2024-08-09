import { AITaskConfig, AITaskFileConfig, AITaskRunParams, IAITask } from "./types";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { generateTree } from "@utils/tree";
import { AISuggestion } from "@services/ai/suggestion";
import { ChatVertexAI } from "@langchain/google-vertexai";
import { MutateMap } from "@services/etc/mutate";
import { SimpleSpread } from "@app/types/etc";

export interface AITaskFileTagConfig extends AITaskFileConfig {
    tags: string[];
    minToAssignTags?: number;
    maxToAssignTags?: number;
}

export interface AIAutoRenameTaskConfig extends SimpleSpread<AITaskConfig, {
    mutate: MutateMap<AITaskFileTagConfig>;
}> {
}

export interface IAIAutoTagTask extends SimpleSpread<IAITask, {
    config: AIAutoRenameTaskConfig;
}> {
}

export class AIAutoTagTask implements IAIAutoTagTask {
    name: string = "autoTag";
    config: AIAutoRenameTaskConfig;

    constructor(config: AIAutoRenameTaskConfig) {
        this.config = config;
    }

    async run(params?: AITaskRunParams) {
        const chat = this.config?.chat ?? new ChatVertexAI({
            temperature: 0.1,
            model: "gemini-1.5-flash",
            location: "europe-west3",
        }).withStructuredOutput(z.object({
            tags: z.array(z.string()).describe("Generated tags based on file content"),
        }), {
            name: "setTags"
        });

        const mut = this.config.mutate;

        const prompt = PromptTemplate.fromTemplate(`You are an AI tasked with tagging files based on their content. For each file provided, analyze its content and generate a set of appropriate tags that describe the file.

Here is the current folder structure:

{folder_structure}

Here are the details of the file:

{file_details}

Here is the content of the file:

{file_content}

Available tags to choose from: {tags}

You must assign between {min_to_assign_tags} and {max_to_assign_tags} tags to this file.

Perform the following tasks:
1. Analyze the content of the file.
2. Generate a set of relevant tags that best describe the file content.
3. Ensure the tags are selected from the available list and meet the minimum and maximum tag requirements.
4. Provide the list of tags.
5. Set tags to the file.
`)
        const { tags, maxToAssignTags, minToAssignTags, file, fsTree } = mut.toObject();

        const output = await chat.invoke([
            ["system", "You are a helpful assistant"],
            ["human", await prompt.format({
                file_details: `File name: ${file.name}, File Path: ${file.getPath()}`,
                folder_structure: generateTree(fsTree, {
                    showFiles: false,
                    showFolders: true
                }),
                tags: tags.join(", "),
                file_content: await file.getContent(),
                max_to_assign_tags: maxToAssignTags ?? 3,
                min_to_assign_tags: minToAssignTags ?? 1,
            })]
        ]) as {
            originalName: string;
            tags: string[];
            filePath: string;
        };

        console.log(output);

        // await params?.mutateParam?.(["file", "tags"], output.tags);

        return [
            new AISuggestion({
                suggestion: {
                    type: "file",
                    task: "tagFile",
                    args: {
                        tags: output.tags
                    }
                }
            })
        ];
    }
}
