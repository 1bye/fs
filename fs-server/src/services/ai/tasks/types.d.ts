import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { FSTreeRoot } from "@utils/tree";
import { AISuggestion } from "@services/ai/suggestion";

export type AvailableTasks = "autoCategory" | "autoTag" | "autoName";

export interface IAITaskExecutor {
    config: AITaskExecutorConfig;
    registeredTasks: IAITask[];

    register(task: IAITask | IAITask[]): void;
    execute(tasks: AvailableTasks[]): Promise<AISuggestion[]>;
}

export interface AITaskExecutorConfig {
    registeredTasks?: IAITask[];
}

export interface IAITask {
    name: string;
    config: AITaskConfig;

    run(): Promise<AISuggestion[]>
}

export interface AITaskConfig {
    file: {
        content: string;
        name: string;
    };
    fsTree: FSTreeRoot;

    /**
     * By default from google AI
     */
    chat?: BaseChatModel;
}