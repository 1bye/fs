import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { FSTreeRoot } from "@utils/tree";
import { AISuggestion } from "@services/ai/suggestion";
import { MutateMap } from "@services/etc/mutate";
import { IFileInput } from "@services/file/input/types";

export type AvailableTasks = "autoMove" | "autoTag" | "autoRename";

export interface IAITaskExecutor {
    config: AITaskExecutorConfig;
    registeredTasks: IAITask[];

    register(task: IAITask | IAITask[]): void;
    execute(tasks: AvailableTasks[]): Promise<AISuggestion[]>;
}

export interface AITaskExecutorConfig {
    registeredTasks?: IAITask[];
    verbose?: boolean;

    delay?: number;

    onMutate?(data: AITaskExecutorOnMutate): Promise<void> | void;
    onSuccessfulTaskExecution?(task: AvailableTasks, suggestions: AISuggestion[]): Promise<void> | void;
}

export interface AITaskExecutorOnMutate {
    task: string;
    param: string | string[];
    value: any;
}

export interface IAITask {
    name: string;
    config: AITaskConfig;

    run(params?: AITaskRunParams): Promise<AISuggestion[]>
}

export interface AITaskRunParams {
    /**
     * If params is string[], it means go deeper of object like obj.property.child_prop.etc...
     * @param param
     * @param value
     */
    mutateParam(param: string | string[], value: any): Promise<void> | void;
}

export interface AITaskConfig {
    mutate: MutateMap<AITaskFileConfig>;
    /**
     * By default from google AI
     */
    chat?: BaseChatModel;
}

export interface AITaskFileConfig {
    file: IFileInput;
    fsTree: FSTreeRoot;
}