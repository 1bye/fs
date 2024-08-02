import { AITaskConfig, IAITask } from "./types";
import { PromptTemplate } from "@langchain/core/prompts";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { generateTree } from "@utils/tree";
import googleConfig from "@config/google.config";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AISuggestion } from "@services/ai/suggestion";
import { AIMessageChunk } from "@langchain/core/messages";
import { zodToGeminiParameters } from "@langchain/google-vertexai/utils";
import { ChatVertexAI } from "@langchain/google-vertexai";
import GoogleCredentials from "../../../../credentials/credentials.json"

export class AIAutoCategoryTask implements IAITask {
    name: string = "autoCategory";
    config: AITaskConfig;

    constructor(config: AITaskConfig) {
        this.config = config;
    }

    genAITools() {
        return [tool(
            (_) => {
                return "File moved successfully";
            },
            {
                name: "moveFile",
                description:
                    "Moves file to specified folder",
                schema: z.object({
                    from: z.string().describe("File path to move"),
                    to: z.string().describe("File destination to move"),
                    type: z.string().describe("This value always should be 'storage'")
                })
            }
        )];
    }

    vertexAITools() {
        return [{
            functionDeclarations: [
                {
                    name: "movefile",
                    description: "Tool to move file to specified folder",
                    parameters: zodToGeminiParameters(z.object({
                        filePath: z.string().describe("File path to move"),
                        destination: z.string().describe("File destination to move"),
                        // type: z.string().describe("This value always should be 'storage'")
                    })),
                },
            ]
        }]
    }

    async run() {
        const tools = this.vertexAITools();
        const chat = this.config?.chat ?? new ChatVertexAI({
            temperature: 0.1,
            model: "gemini-1.5-flash",
            location: "europe-west3",
            // authOptions: {
            //     // projectId: googleConfig.projectId,
            //     // credentials: GoogleCredentials
            // }
            // apiKey: googleConfig.genAI.apiKey
        }).withStructuredOutput(z.object({
            filePath: z.string().describe("File path to move"),
            destination: z.string().describe("File destination to move"),
        }), {
            name: "moveFile"
        });

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


        // const output = await prompt.pipe(chat).invoke({
        //     file_content: this.config.file.content,
        //     file_details: `File name: ${this.config.file.name}`,
        //     folder_structure: generateTree(this.config.fsTree, {
        //         showFiles: false,
        //         showFolders: true
        //     })
        // }) as AIMessageChunk;
        // console.log(output)
        const output = await chat.invoke([
            ["system", "You are a helpful assistant"],
            // ["human", "What is 1628253239 times 81623836?"]
            ["human", await prompt.format({
                file_details: `File name: ${this.config.file.name}`,
                folder_structure: generateTree(this.config.fsTree, {
                    showFiles: false,
                    showFolders: true
                }),
                file_content: this.config.file.content,
            })]
        ]) as {
            filePath: string;
            destination: string;
        };

        // const tool_calls = output.tool_calls ?? [];
        //
        // const suggestions = tool_calls.map(_ => {
        //     const { type = "storage", ...args } = _.args;
        //     return new AISuggestion({
        //         suggestion: {
        //             task: _.name,
        //             type,
        //             args
        //         }
        //     });
        // });
        //
        // if (suggestions.length > tools.length) {
        //     console.log({ suggestions, tools });
        //     throw new Error("Suggestions count is more then tools");
        // }
        //
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