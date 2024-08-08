export interface IAISuggestion {
    config: AISuggestionConfig;

    getSuggestion<Args extends SuggestionArgs = SuggestionArgs>(): Suggestion<Args>;
}

export type SuggestionArgs = Record<string, any> | any[];

export type Suggestion<Args extends SuggestionArgs = SuggestionArgs> = {
    type: string;
    task: string;
    args: Args;
}

export interface AISuggestionConfig<Args extends SuggestionArgs = SuggestionArgs> {
    suggestion: Suggestion<Args>;
}

export interface IAISuggestionExecutor {
    config: AISuggestionExecutorConfig;

    run(suggestions: IAISuggestion[]): Promise<AISuggestionExecutorRunOutput>
}

export interface AISuggestionExecutorConfig {
    types: Record<string, unknown>;

    delay?: number;
    /**
     * Blocks not allowed types, by default undefined, which means nothing to block
     * Usage:
     * ```
     * {
     *   "typeName": ["allowedTask", "allowedTask2"]
     * }
     * ```
     */
    allowedTasks?: Record<string, string[]>

    callbacks?: {
        /**
         * Runs when suggestion task not given any exception
         * @param suggestion
         */
        onSuccessfulSuggestionRun(suggestion: IAISuggestion): void | Promise<void>
    }
}

export type AISuggestionExecutorRunOutput = {
    success: boolean;
    errors?: Record<string, Error>;
}