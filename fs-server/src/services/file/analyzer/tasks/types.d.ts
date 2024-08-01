import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { FSTreeRoot } from "@utils/tree";

export interface IFileAnalyzerTask {
    config: FileAnalyzerTaskConfig;
}

export interface FileAnalyzerTaskConfig {
    textContent: string;
    fsTree: FSTreeRoot;

    /**
     * By default from google AI
     */
    chat?: BaseChatModel;
}